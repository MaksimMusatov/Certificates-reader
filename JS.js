function keyStorage(keyName) {
  var keys = JSON.parse(localStorage.getItem(keyName)) || [];
  var obj = {};
  keys.forEach(function(key) {
    obj[keys] = localStorage.getItem(key);
  });
  var listeners = [];

  return {
    getState: function() {
      return obj;
    },
    addItem: function(cert) {
      var key = window.uuid.v4();
      obj[key] = cert;
      localStorage.setItem(key, cert);
      localStorage.setItem(keyName, JSON.stringify(Object.keys(obj)));
      listeners.forEach(function(fn) {
        fn(obj);
      });
    },
    removeItem: function(key) {
      delete obj[key];
      localStorage.removeItem(key, reader.result);
      localStorage.setItem(keyName, JSON.stringify(Object.keys(obj)));
      listeners.forEach(function(fn) {
        fn(obj);
      });
    },
    subscribe: function(listener) {
      listeners.push(listener);
    }
  };
}

var KEY_STORAGE = keyStorage("certKeys");
var dropZone = document.getElementById("drop_zone");
var certList = document.getElementById("cert_list");

function render(state) {
  certList.innerHTML = Object.values(state)
    .map(function(cert) {
      var data = parseCert(cert);
      return (
        "<li class='cert_info'>" +
        "<b><p>Common Name: </b>" +
        data.commonName +
        "</p>" +
        "<div class='detailsInfo'>" +
        "<b><p>Issuer CN: </b>" +
        data.issuerCN +
        "</p>" +
        "<b><p>Valid From: </b>" +
        data.validFrom +
        "</p>" +
        "<b><p>Valid To: </b>" +
        data.validTo +
        "</p>" +
        "</div>" +
        "</li>"
      );
    })
    .join("");
}

KEY_STORAGE.subscribe(render);
render(KEY_STORAGE.getState());

function parseCert(cert) {
  var asn = ASN1.decode(cert);
  var issuerCN = asn.sub[0].sub[3].sub[2].sub[0].sub[1].content();
  var validFrom = asn.sub[0].sub[4].sub[0].content();
  var validTo = asn.sub[0].sub[4].sub[1].content();
  var commonName = asn.sub[0].sub[5].sub[3].sub[0].sub[1].content();
  return {
    issuerCN: issuerCN,
    validFrom: validFrom,
    validTo: validTo,
    commonName: commonName
  };
}

function handleDrop(e) {
  e.preventDefault();

  var dt = e.dataTransfer;
  for (var i = 0; i < dt.items.length; i++) {
    if (dt.items[i].kind == "file") {
      var f = dt.items[i].getAsFile();
      var reader = new FileReader();
      reader.addEventListener("loadend", function() {
        KEY_STORAGE.addItem(reader.result);
      });
      reader.readAsBinaryString(f);
    }
  }
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
}

dropZone.addEventListener("dragover", handleDragOver, false);
dropZone.addEventListener("drop", handleDrop, false);

document.querySelector("ul").addEventListener("click", toggleCard);
function toggleCard(event) {
  var card = event.target.closest(".cert_info");
  if (!card) return;
  card.classList.toggle("hidden");
}
