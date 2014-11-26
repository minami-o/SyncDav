/* global DAVLib */

'use strict';

var App = function App() {

  var store = null;
  var info = null;
  var fillButton, resetButton;

  var init = function init() {
    info = document.getElementById('info');
    fillButton = document.getElementById('fillDS');
    resetButton = document.getElementById('resetDS');

    fillButton.addEventListener('click', handleEvent);
    resetButton.addEventListener('click', handleEvent);
  };

  function handleEvent(evt) {
    var btn = evt.target.id;
    var accountData = {
      url: document.getElementById('url').value,
      user: document.getElementById('user').value,
      password: document.getElementById('passwd').value
    };

    switch (btn) {
      case 'fillDS':
        fillButton.disabled = true;

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
                    contact.bday = data.note;
                  }
                  
                  if(data.sex) {
                    contact.sex = data.sex;
                  }
                  
                  if(data.gender) {
                    contact.genderIdentity = data.gender;
                  }
                  
                  var saving = navigator.mozContacts.save(contact);
                  saving.onsuccess = function() {
                    console.log('New contact saved');
                    nbContactsSaved++;
                    if(nbContactsSaved + nbContactsNoSaved === contactsList.length) {
                      alert(nbContactsSaved + ' / ' + contactsList.length + ' contact(s) saved');
                      fillButton.disabled = false;
                    }
                  };
                  saving.onerror = function(err) {
                    console.error(err);
                    nbContactsNoSaved++;
                    if(nbContactsSaved + nbContactsNoSaved === contactsList.length) {
                      alert(nbContactsSaved + ' / ' + contactsList.length + ' contact(s) saved');
                      fillButton.disabled = false;
                    }
                  }
                });
              });
            }
          });
        };
        
        break;
      case 'resetDS':
        var q = confirm("Remove ALL the contacts from ? Be careful!!! There is no way back!");
        if (q) {
          var req = navigator.mozContacts.clear();
          req.onsuccess = function() {
            alert('All contacts have been removed.');
          };
          req.onerror = function() {
            alert('[error] No contacts were removed.');
          };
        }
        break;
      default:
        break;
    }
  }

  function initDS() {
    function storeError() {
      info.textContent = 'Error getting store';
    }

    if (!navigator.getDataStores) {
      info.textContent = 'NO DataStore API!';
      return;
    }

    navigator.getDataStores(DS_NAME).then(function(ds) {
      if (!ds || ds.length < 1) {
        storeError();
        return;
      }
      ds.forEach(function onDs(datastore) {
        if (datastore.owner.indexOf('provider3')) {
          store = datastore;
          console.log('Got store ' + store.owner);
        }
      });

      store.getLength().then(function(count) {
        info.textContent = count + ' elements';
      });
    }, function() {
      storeError();
    });
  }

  return {
    init: init
  };

}();

App.init();
