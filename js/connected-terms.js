$(document).ready(function(){	
	makePageSections();
	
	inputSuggestion($("#inputSection"), "inputbar");
	
	makeSynStack();
});


var simpleTerm;
var simpleStack;

function simpleSearch(){
	var thepage = document.getElementById("thepage");
	var input = document.getElementById("inputSection");
	var input = document.getElementById("inputbar");
	var tableform = document.getElementById("tableform");
	var downloadform = document.getElementById("downloadform");
	while(downloadform.firstChild){
		downloadform.removeChild(downloadform.firstChild);
	}
	
	var term = input.value;
	var term1 = synStack.getSyn(term);

	if(term1 && term1.includes('|')){	
		console.log("IS SYNONYM");
		term1 = term1.split('|');
		term = term1[1]; //term1.mainTerm.name;
	}
	
	console.log("Check 1");
	console.log(term);
	var loader = document.createElement("img");
	loader.src = "img/ajax-loader.gif";
	loader.alt = "Searching";
	loader.id = "loader";
	thepage.appendChild(loader);
	
	tableform.innerHTML = "Looking for term: " + term ;
	console.log(term);
	
	var checkbox = document.getElementById("mappedCheckbox");
	if(checkbox.checked){
		console.log("IsChecked");
		simpleTerm = term;
		var pay = JSON.stringify({
			"statements" : [{
				"statement" : "match (n:Term{name:{name}})-[:MAPPED]->(a) return a " , "parameters" : {"name": term}
			}]
		});
		queryNeo4j(pay,findSimpleSubterms);
	}else{
		var payload = JSON.stringify({
			"statements" : [{
				"statement" : "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m) return m, a " , "parameters" : {"name": term}
			}]
		});
		queryNeo4j(payload,simpleSearchOnSuccess);	
		console.log("IsNotCheck");
	}
	
}


	
function simpleSearchOnSuccess(data){
	var thepage = document.getElementById("thepage");
	var input = document.getElementById("inputSection");
	var input = document.getElementById("inputbar");
	var tableform = document.getElementById("tableform");
	console.log("Finished Search");
	//tableform.innerHTML = "Processing Results: " + term ;
	//tableform.innerHTML = JSON.stringify(data);
	var results = data["results"][0];
	var data2 = results["data"];

	var stack = new ThornStack();
	for (var i=0; i< data2.length ; i++){
		var name = data2[i]["row"][0]["name"];
		var type = data2[i]["row"][0]["type"];
		var stype = data2[i]["row"][0]["stype"];
		var date = data2[i]["row"][1]["date"];
		var pmid = data2[i]["row"][1]["pmid"];
		var title = data2[i]["row"][1]["title"];
		
		var check = stack.get(name);

		if(!check){
			var term = new Term(name,type,stype);
			
			var isDrug = data2[i]["row"][0]["isDrug"];
			if(isDrug=="true"){term.isDrug=true;}
			
			stack.add(name,term);
			term.addArt(pmid,date,stack,title);
		}else{			
			check.addArt(pmid,date,stack,title);
		}	
	}
	//stack.getTest("Analgesics, Opioid");
	console.log("Done");
	tableform.innerHTML = "";
	
	var loader = document.getElementById("loader");
	thepage.removeChild(loader);

	makeFilters(stack,input.value);
	makeTables(stack,tableLimit);
	makeDownloadableCSV(input.value,stack);
}



function findSimpleSubterms(data){
	subTerms = [];
	var mappedResults = document.getElementById("mappedResults");
	var button = document.createElement("button");
	mappedResults.appendChild(button);
	button.onclick = showSubterms;
	button.innerHTML = "Click Here to see Subterms";
	var results = data["results"][0];
	var data2 = results["data"];
	simpleStack = new ThornStack();
	
	subTermCount = 0;
	subTermMax = data2.length + 1;
	console.log(subTermMax);
	var payload = JSON.stringify({
			"statements" : [{
				"statement" : "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m) return m, a " , "parameters" : {"name": simpleTerm}
			}]
		});
	queryNeo4j(payload,addSimpleSubtermData);
	
	
	for (var i=0; i< data2.length ; i++){
		var name = data2[i]["row"][0]["name"];	
		subTerms.push(name);
		//mappedResults.innerHTML = mappedResults.innerHTML +  " | " + name;		

		var payload = JSON.stringify({
			"statements" : [{
				"statement" : "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m) return m, a " , "parameters" : {"name": name}
			}]
		});
		queryNeo4j(payload,addSimpleSubtermData);			
	}
}


function addSimpleSubtermData(data){
	
	var results = data["results"][0];
	var data2 = results["data"];
	var stack = simpleStack;
	
	for (var i=0; i< data2.length ; i++){
		var name = data2[i]["row"][0]["name"];
		var type = data2[i]["row"][0]["type"];
		var stype = data2[i]["row"][0]["stype"];
		var date = data2[i]["row"][1]["date"];
		var pmid = data2[i]["row"][1]["pmid"];
		var title = data2[i]["row"][1]["title"];

		var check = stack.get(name);

		if(!check){
			var term = new Term(name,type,stype);
			
			var isDrug = data2[i]["row"][0]["isDrug"];
			if(isDrug=="true"){term.isDrug=true;}
			
			stack.add(name,term);
			term.addArt(pmid,date,stack,title);
		}else{
			check.addArt(pmid,date,stack,title);
		}	
	}
	console.log("FINISHED SUBTERM or TERM");
	subTermCount = subTermCount + 1;
	if(subTermCount>subTermMax){
		console.log("GREATER:"+subTermCount);
	}else if(subTermCount==subTermMax){
		var loader = document.getElementById("loader");
		thepage.removeChild(loader);
		console.log(subTermCount);
		var input = document.getElementById("inputbar");
		makeFilters(stack,input.value);
		makeTables(stack,tableLimit);
		makeDownloadableCSV(input.value,stack);
	}else if(subTermCount==subTermMax-1){
		console.log("Got Here");
	}
}

