'use strict';

var App = function App() {

  var btnSync, btnConfig, btnReset, btnResetConfirmed, btnCloseConfig, btnSaveConfig;

  var init = function init() {
    btnSync = document.getElementById('sync');
    btnConfig = document.getElementById('config');
    btnReset = document.getElementById('reset');
    btnResetConfirmed = document.getElementById('resetConfirmed');
    btnCloseConfig = document.getElementById('closeConfig');
    btnSaveConfig = document.getElementById('saveConfig');

    btnSync.addEventListener('click', handleEvent);
    btnConfig.addEventListener('click', handleEvent);
    btnReset.addEventListener('click', handleEvent);
    btnResetConfirmed.addEventListener('click', handleEvent);
    btnCloseConfig.addEventListener('click', handleEvent);
    btnSaveConfig.addEventListener('click', handleEvent);
    
    if(localStorage.getItem('url') === null) {
      document.getElementById('main').style.display = 'none';
      document.getElementById('settings').style.display = 'block';
    }
  };

// Helper functions for base64
  function b64ToUint6 (nChr) {
    return nChr > 64 && nChr < 91 ?
        nChr - 65
      : nChr > 96 && nChr < 123 ?
        nChr - 71
      : nChr > 47 && nChr < 58 ?
        nChr + 4
      : nChr === 43 ?
        62
      : nChr === 47 ?
        63
      :
        0;
  }

  function base64DecToArr (sBase64, nBlocksSize) {
    var
      sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length,
      nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2, taBytes = new Uint8Array(nOutLen);

    for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
      nMod4 = nInIdx & 3;
      nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
      if (nMod4 === 3 || nInLen - nInIdx === 1) {
        for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
          taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
          }
          nUint24 = 0;
        }
      }
    return taBytes;
  }
// End of helper functions for base64

  function handleEvent(evt) {
    var btn = evt.target.id;

    switch (btn) {
      case 'config':
        if(localStorage.getItem('url') != null) {
          document.getElementById('url').value = localStorage.getItem('url');
          document.getElementById('user').value = localStorage.getItem('user');
          document.getElementById('passwd').value = localStorage.getItem('passwd');
        }
        document.getElementById('main').style.display = 'none';
        document.getElementById('settings').style.display = 'block';
        break;
      case 'closeConfig':
        document.getElementById('main').style.display = 'block';
        document.getElementById('settings').style.display = 'none';
        break;
      case 'saveConfig':
        localStorage.setItem('url', document.getElementById('url').value);
        localStorage.setItem('user', document.getElementById('user').value);
        localStorage.setItem('passwd', document.getElementById('passwd').value);
        
        document.getElementById('main').style.display = 'block';
        document.getElementById('settings').style.display = 'none';
        break;
      case 'sync':
        if(localStorage.getItem('url') === null) {
          document.getElementById('main').style.display = 'none';
          document.getElementById('settings').style.display = 'block';
          return;
        }
        
        btnSync.disabled = true;

        var accountData = {
          url: localStorage.getItem('url'),
          user: localStorage.getItem('user'),
          password: localStorage.getItem('passwd')
        };
        var openedDAVConnection = jsDAVlib.getConnection(accountData);
        openedDAVConnection.onready = function() {
          console.log('connectionInfo: ' +
            JSON.stringify(openedDAVConnection.getInfo()));

          openedDAVConnection.getResource(null, function(res, error) {
            if (error) {
              console.log('Error getting main resource - ' + error);
              return;
            }

            var openedDAVMainResource = res;

            var contactsList = openedDAVMainResource.get().data;
            var nbContactsSaved = 0;
            var nbContactsNoSaved = 0;
            
            document.getElementById('syncStatus').style.display = 'block';
            document.getElementById('nbContacts').textContent = contactsList.length;

            for (var i = 0; i < contactsList.length; i++) {
              openedDAVConnection.getResource(contactsList[i].href, function(res, e) {
                var vcard = res.contents;
                VCF.parse(vcard, function(data) {
                  var contact = new mozContact();
                  
                  if(data.fn) {
                    contact.name = [data.fn];
                  }
                  
                  if(data.n) {
                    if(data.n['family-name']) {
                      contact.familyName = data.n['family-name'];
                    }
                    
                    if(data.n['given-name']) {
                      contact.givenName = data.n['given-name'];
                    }
                    
                    if(data.n['additional-name']) {
                      contact.additionalName = data.n['additional-name'];
                    }
                    
                    if(data.n['honorific-prefix']) {
                      contact.honorificPrefix = data.n['honorific-prefix'];
                    }
                    
                    if(data.n['honorific-suffix']) {
                      contact.honorificSuffix = data.n['honorific-suffix'];
                    }
                  }
                  
                  if(data.nickname) {
                    contact.nickname = data.nickname;
                  }
                  
                  if(data.email) {
                    contact.email = data.email;
                  }
                  
                  if(data.tel) {
                    contact.tel = data.tel;
                  }
                  
                  if(data.org) {
                    contact.org = data.org;
                  }
                  
                  if(data.bday) {
                    contact.bday = data.bday;
                  }
                  
                  if(data.note) {
                    contact.note = data.note;
                  }
                  
                  if(data.sex) {
                    contact.sex = data.sex;
                  }
                  
                  if(data.gender) {
                    contact.genderIdentity = data.gender;
                  }

                  if(data.photo) {
            	    for(i = 0; i < data.photo.length; i++) {
            	      data.photo[i] = base64DecToArr(data.photo[i]);
	            }
                    contact.photo = [new Blob(data.photo)];
                  }

                  if(data.adr) {
                    contact.adr = data.adr;
                  }
                  
                  var saving = navigator.mozContacts.save(contact);
                  saving.onsuccess = function() {
                    console.log('New contact saved');
                    nbContactsSaved++;
                    document.getElementById('nbImported').textContent = nbContactsSaved;
                    if(nbContactsSaved + nbContactsNoSaved === contactsList.length) {
                      btnSync.disabled = false;
                      setTimeout(function() {
                        document.getElementById('syncStatus').style.display = 'none';
                      }, 5000);
                    }
                  };
                  saving.onerror = function(err) {
                    console.error(err);
                    nbContactsNoSaved++;
                    if(nbContactsSaved + nbContactsNoSaved === contactsList.length) {
                      btnSync.disabled = false;
                      setTimeout(function() {
                        document.getElementById('syncStatus').style.display = 'none';
                      }, 5000);
                    }
                  }
                });
              });
            }
          });
        };
        
        break;
      case 'reset':
        document.getElementById('main').style.display = 'none';
        document.getElementById('confirmDialog').style.display = 'block';
        break;
      case 'resetConfirmed':
        document.getElementById('main').style.display = 'block';
        document.getElementById('confirmDialog').style.display = 'none';
        
        btnReset.disabled = true;
        
        var req = navigator.mozContacts.clear();
        req.onsuccess = function() {
          document.getElementById('status').innerHTML = '<p>All contacts have been removed.</p>';
          document.getElementById('status').style.display = 'block';
          btnReset.disabled = false;
          console.log('All contacts have been removed.');
        };
        req.onerror = function() {
          document.getElementById('status').innerHTML = '<p>[error] No contacts were removed.</p>';
          document.getElementById('status').style.display = 'block';
          btnReset.disabled = false;
          console.warn('No contacts were removed.');
        };
        break;
      default:
        break;
    }
  }

  return {
    init: init
  };

}();

App.init();
