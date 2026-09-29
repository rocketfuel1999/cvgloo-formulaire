import asyncio, os, sys
from playwright.async_api import async_playwright

BASE = os.environ.get("BASE_URL", "http://localhost:8123")
errors = []

async def check_page(page, path):
    console_errors = []
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.on("pageerror", lambda exc: console_errors.append(str(exc)))
    resp = await page.goto(f"{BASE}/{path}", wait_until="networkidle")
    status = resp.status if resp else None
    if status != 200:
        errors.append(f"{path}: HTTP {status}")
    if console_errors:
        errors.append(f"{path}: console errors {console_errors}")
    return console_errors

async def main():
    async with async_playwright() as p:
        exe = os.environ.get("PW_CHROMIUM")
        browser = await p.chromium.launch(executable_path=exe) if exe else await p.chromium.launch()

        # Desktop pass over every page
        page = await browser.new_page(viewport={"width": 1280, "height": 900})
        for path in ["index.html", "mentions-legales.html", "cgv.html", "confidentialite.html"]:
            await check_page(page, path)
        await page.screenshot(path="/tmp/shot_desktop_index.png", full_page=True)

        # Mobile viewport
        mpage = await browser.new_page(viewport={"width": 375, "height": 812})
        await check_page(mpage, "index.html")
        await mpage.screenshot(path="/tmp/shot_mobile_index.png", full_page=True)
        await mpage.close()

        # Full form flow (desktop page)
        await page.goto(f"{BASE}/index.html", wait_until="networkidle")
        await page.wait_for_timeout(2600)  # let splash hide

        # Step 1
        await page.click("#pro")
        await page.fill("#companyName", "Test Entreprise SARL")
        await page.fill("#contactPro", "06 12 34 56 78")
        await page.click("#btnStep1Continue")
        await page.wait_for_selector('[data-step="2"].active')

        # Step 2
        await page.click("#p2")  # Site web
        await page.wait_for_selector("#siteWebOptions.active")
        await page.click("#web2")
        await page.click("#p1")
        await page.click("#btnStep2Continue")
        await page.wait_for_selector('[data-step="3"].active')

        # Step 3 - try continue without contexte/consent to test validation
        page.once("dialog", lambda d: asyncio.ensure_future(d.accept()))
        await page.click("text=Voir le récapitulatif")
        await page.wait_for_timeout(300)
        still_step3 = await page.eval_on_selector('[data-step="3"]', "el => el.classList.contains('active')")
        if not still_step3:
            errors.append("Validation du contexte vide a échoué (le formulaire a avancé sans description).")

        await page.fill("#contexte", "Site vitrine pour mon activité de coach sportif, 5 pages, besoin de réservation en ligne.")

        # try continue without consent checked
        page.once("dialog", lambda d: asyncio.ensure_future(d.accept()))
        await page.click("text=Voir le récapitulatif")
        await page.wait_for_timeout(300)
        still_step3_no_consent = await page.eval_on_selector('[data-step="3"]', "el => el.classList.contains('active')")
        if not still_step3_no_consent:
            errors.append("Validation du consentement a échoué (le formulaire a avancé sans consentement coché).")

        await page.check("#consent")
        await page.click("text=Voir le récapitulatif")
        await page.wait_for_selector('[data-step="4"].active')

        recap = await page.inner_text("#recapContent")
        if "Test Entreprise SARL" not in recap or "coach sportif" not in recap:
            errors.append(f"Récapitulatif incomplet: {recap[:300]}")

        await page.screenshot(path="/tmp/shot_recap.png", full_page=True)

        # Legal link check on step 3 (navigate back, then forward again is fine) - just verify href resolves
        await page.goto(f"{BASE}/mentions-legales.html")
        legal_text = await page.inner_text("body")
        if "838 496 826" not in legal_text:
            errors.append("Le numéro RCS est absent des mentions légales.")

        await browser.close()

    if errors:
        print("ECHECS:")
        for e in errors:
            print(" -", e)
        sys.exit(1)
    else:
        print("Tous les tests sont passés.")

asyncio.run(main())
