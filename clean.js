//load
window.addEventListener('load', function() {
	//Hier irgendwo auftrag für scan bei? oder doch in background?

	//eher settings an background weitergeben
	sendMessage('enabled?', null, function(response) { 
		document.querySelector("input[type=checkbox]#enabled").checked = response.enabled;
	});

	//settings von html objekten holen
	document.querySelector("input[type=checkbox]#enabled").addEventListener('click', function() {
		console.log(this.checked);
		chrome.browserAction.setIcon({ path: this.checked ? "icons/icon48.png" : "icons/icon_bw48.png" });
		sendMessage('enable', this.checked, null);
	}, false);

	document.querySelector("input[type=checkbox]#unknown").addEventListener('click', function() {
		console.log(this.checked);
		document.getElementById("results").className = this.checked ? "" : "hideunknown";
	}, false);

	//results abrufen
	queryForResults();//trigger
	setInterval(queryForResults, 5000);

}, false);

function queryForResults() {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	  //get detected sagt nur dass Ergebnisse zurück gesendet sollen 
	  //Ergebnisse werden nur geholt, nicht erzeugt?
	  chrome.tabs.sendMessage(tabs[0].id, { getDetected: 1 }, function(response) {
		//woher?
	    show(response); //total results
	  });
	});	
}

//display results in pop up (build table)
function show(totalResults) {
	if (totalResults != null) {
		document.getElementById("results").innerHTML="";
		//console.log(totalResults);
		var merged = {};
		totalResults.forEach(rs => {
			merged[rs.url] = merged[rs.url] || { url: rs.url, results: [] };
			merged[rs.url].results = merged[rs.url].results.concat(rs.results);
		});

		var results = Object.keys(merged).map(k => merged[k]);
		results.forEach(function(rs) { //results wird zu rs für each
			rs.results.forEach(function(r) { //rs wird zu r für each
				r.url = rs.url;
				r.vulnerable = r.vulnerabilities && r.vulnerabilities.length > 0;
			});
			if (rs.results.length == 0) {
				rs.results = [{ url: rs.url, unknown: true, component: "unknown" }]
			}
		});
		var res = results.reduce(function(x, y) { return x.concat(y.results); }, []);
		res.sort(function(x, y) {
			if (x.unknown != y.unknown) { return x.unknown ? 1 : -1 }
			if (x.vulnerable != y.vulnerable) { return x.vulnerable ? -1 : 1 }
			return (x.component + x.version + x.url).localeCompare(y.component + y.version + y.url);
		});
		res.forEach(function(r) {
			var tr = document.createElement("tr");
			document.getElementById("results").appendChild(tr);				
			if (r.unknown) {
				tr.className = "unknown";
				td(tr).innerText = "-";
				td(tr).innerText = "-";
				td(tr).innerHTML = "Did not recognize " + r.url;
			} else {
				td(tr).innerText = r.component;
				td(tr).innerText = r.version;
				var vulns = td(tr);
				vulns.innerHTML = "Found in " + r.url;
			}
			if (r.vulnerabilities && r.vulnerabilities.length > 0) {
				tr.className = "vulnerable";
				vulns.innerHTML += "<br>Vulnerability info: ";
				var table = document.createElement("table");
				vulns.appendChild(table);
				r.vulnerabilities.forEach(function(v) {
					var tr = document.createElement("tr");
					table.appendChild(tr);
					td(tr).innerText = v.severity || " ";
					td(tr).innerText = v.identifiers ? v.identifiers.mapOwnProperty(function(val) { return val }).flatten().join(" ") : " ";
					var info = td(tr);
					v.info.forEach(function(u, i) {
						var a = document.createElement("a");
						a.innerText = i + 1;
						a.href = u;
						a.title = u;
						a.target = "_blank";
						info.appendChild(a);
					});
				})
			}
		})
	}
}
//was macht der jetzt?
function td(tr) {
	var cell = document.createElement("td");
	tr.appendChild(cell);
	return cell;
}

Object.prototype.forEachOwnProperty = function(f) {
	mapOwnProperty(f);
};
Object.prototype.mapOwnProperty = function(f) {
	var results = [];
	for(var i in this) {
		if (this.hasOwnProperty(i)) results.push(f(this[i], i));
	}
	return results;
};

Array.prototype.flatten = function() { return this.reduce((a,b) => a.concat(b), []) }

//hierher?
function sendMessage(message, data, callback) {
	chrome.extension.sendRequest({ to: 'background', message: message, data: data }, function(response) { callback && callback(response) });
}