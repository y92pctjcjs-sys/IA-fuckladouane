import('./main.js?v=pursuit3').catch(error => {
  console.error('FLD course boot:', error);
  document.querySelectorAll('#overlay .panel').forEach(panel => { panel.hidden = true; });
  document.querySelector('#overlay').hidden = false;
  document.querySelector('#failure').hidden = false;
  document.querySelector('.tools').hidden=true;
  document.querySelector('#failureMessage').textContent = 'Le moteur 3D n’a pas pu démarrer. WebGL doit être disponible et les fichiers locaux du jeu doivent être chargés. Rechargez cette page ou revenez au protocole.';
});
