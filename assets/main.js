// Colle ici l'URL de ton Google Apps Script (Étape "Déploiement" du tutoriel).
// Tant que c'est vide, le formulaire fonctionne normalement, juste sans suivi.
const SHEET_ENDPOINT = 'https://script.google.com/macros/s/AKfycbz_TwnjS_iDw-5LkL1hr1xUQC8OWkYzyCTvxNGMGY90I3IWmuL8dQgZ4EvlCpb2Ljcybw/exec';

function logToSheet(etape, extra = {}) {
  if (!SHEET_ENDPOINT) return;
  let identite = '', contact = '', profileVal = '';
  try {
    const p = getProfileData();
    identite = p.identite || '';
    contact = p.contact || '';
    profileVal = p.profile || '';
  } catch (e) {}
  const payload = {
    etape,
    profile: profileVal,
    identite,
    contact,
    prestations: (typeof getPrestations === 'function' ? getPrestations().join(', ') : ''),
    formuleWeb: document.querySelector('input[name="formule-web"]:checked')?.value || '',
    projet: document.getElementById('contexte')?.value.trim() || '',
    filelink: document.getElementById('filelink')?.value.trim() || '',
    consentement: document.getElementById('consent')?.checked ? 'oui' : 'non',
    canal: extra.canal || ''
  };
  fetch(SHEET_ENDPOINT, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  }).catch(() => {});
}

function goStep(n) {
  if (n === 2) {
    const profile = document.querySelector('input[name="profile"]:checked');
    if (!profile) { alert('Merci de choisir une option.'); return; }
    if (profile.value.startsWith('Professionnel')) {
      if (!document.getElementById('companyName').value.trim() || !document.getElementById('contactPro').value.trim()) {
        alert('Merci de compléter le nom de l\'entreprise et le contact.'); return;
      }
    } else {
      if (!document.getElementById('firstName').value.trim() || !document.getElementById('contactPart').value.trim()) {
        alert('Merci de compléter votre prénom et votre contact.'); return;
      }
    }
    logToSheet('1 - Identité renseignée');
  }
  if (n === 3) {
    const prestations = document.querySelectorAll('input[name="prestation"]:checked');
    if (prestations.length === 0) { alert('Merci de choisir au moins une prestation.'); return; }
    const siteWebChecked = document.getElementById('p2').checked;
    if (siteWebChecked && !document.querySelector('input[name="formule-web"]:checked')) {
      alert('Merci de choisir une formule pour le site web.'); return;
    }
    logToSheet('2 - Prestations sélectionnées');
  }
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.querySelector(`[data-step="${n}"]`).classList.add('active');
  window.scrollTo(0, 0);
}

document.querySelectorAll('input[name="profile"]').forEach(input => {
  input.addEventListener('change', () => {
    document.getElementById('proFields').classList.toggle('active', input.value.startsWith('Professionnel') && input.checked);
    document.getElementById('partFields').classList.toggle('active', input.value === 'Particulier' && input.checked);
  });
});

document.getElementById('p2').addEventListener('change', (e) => {
  document.getElementById('siteWebOptions').classList.toggle('active', e.target.checked);
});

function getProfileData() {
  const profile = document.querySelector('input[name="profile"]:checked')?.value || '';
  const isPro = profile.startsWith('Professionnel');
  return {
    profile,
    identite: isPro ? document.getElementById('companyName').value.trim() : document.getElementById('firstName').value.trim(),
    identiteLabel: isPro ? 'Nom de l\'entreprise / Raison sociale' : 'Prénom',
    contact: isPro ? document.getElementById('contactPro').value.trim() : document.getElementById('contactPart').value.trim()
  };
}

function getPrestations() {
  return Array.from(document.querySelectorAll('input[name="prestation"]:checked')).map(i => i.value);
}

function buildMessageText() {
  const p = getProfileData();
  const prestations = getPrestations();
  const formuleWeb = document.querySelector('input[name="formule-web"]:checked')?.value;
  const contexte = document.getElementById('contexte').value.trim();
  const filelink = document.getElementById('filelink').value.trim();

  let txt = 'DEMANDE DE DEVIS — CVGLOO\n\n';
  txt += `Profil : ${p.profile}\n`;
  txt += `${p.identiteLabel} : ${p.identite}\n`;
  txt += `Contact : ${p.contact}\n\n`;
  txt += `Prestations : ${prestations.join(', ')}`;
  if (formuleWeb) txt += `\nFormule site web : ${formuleWeb}`;
  txt += `\n\nProjet :\n${contexte}`;
  if (filelink) txt += `\n\nFichiers/liens joints :\n${filelink}`;
  return txt;
}

function showRecap() {
  const p = getProfileData();
  const prestations = getPrestations();
  const formuleWeb = document.querySelector('input[name="formule-web"]:checked')?.value;
  const contexte = document.getElementById('contexte').value.trim();
  const filelink = document.getElementById('filelink').value.trim();
  const consent = document.getElementById('consent')?.checked;

  if (!contexte) { alert('Merci de décrire votre projet avant de continuer.'); return; }
  if (!consent) { alert('Merci d\'accepter que CVGLOO vous recontacte pour traiter votre demande.'); return; }

  let html = '';
  html += recapBlock('Profil', p.profile);
  html += recapBlock(p.identiteLabel, p.identite);
  html += recapBlock('Contact', p.contact);
  html += recapBlock('Prestations', prestations.join(', '));
  if (formuleWeb) html += recapBlock('Formule site web', formuleWeb);
  html += recapBlock('Projet', contexte);
  if (filelink) html += recapBlock('Fichiers / liens', filelink);

  document.getElementById('recapContent').innerHTML = html;
  document.getElementById('sendPanel').classList.remove('active');
  logToSheet('3 - Récapitulatif consulté');
  goStep(4);
}

function recapBlock(label, value) {
  return `<div class="recap-item"><div class="recap-label">${label}</div><div class="recap-value">${escapeHtml(value)}</div></div>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function toggleSendPanel() {
  document.getElementById('sendPanel').classList.toggle('active');
}

function sendVia(method) {
  const txt = buildMessageText();
  logToSheet('4 - Demande envoyée', { canal: method });
  if (method === 'mail') {
    window.location.href = 'mailto:cvgloo2000@gmail.com?subject=' + encodeURIComponent('Demande de devis CVGLOO') + '&body=' + encodeURIComponent(txt);
  } else if (method === 'whatsapp') {
    window.open('https://wa.me/33757825079?text=' + encodeURIComponent(txt), '_blank');
  } else if (method === 'instagram') {
    navigator.clipboard.writeText(txt).then(() => {
      window.open('https://www.instagram.com/cvgloo/', '_blank');
      alert('Texte copié 📋 — collez-le dans le message Instagram (Instagram ne permet pas le pré-remplissage automatique).');
    });
  } else if (method === 'snapchat') {
    navigator.clipboard.writeText(txt).then(() => {
      window.open('https://www.snapchat.com/add/cvgloo', '_blank');
      alert('Texte copié 📋 — collez-le dans le message Snapchat (Snapchat ne permet pas le pré-remplissage automatique).');
    });
  }
}

window.addEventListener('load', () => {
  setTimeout(() => {
    const splash = document.getElementById('splash');
    if (splash) splash.classList.add('hidden');
  }, 2400);
});
