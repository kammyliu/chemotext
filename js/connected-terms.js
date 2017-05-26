var thepage, input, tableform, downloadform;

$(document).ready(function(){	
		
	thepage = document.getElementById("thepage");
	input = document.getElementById("inputbar");
	tableform = document.getElementById("tableform");
	downloadform = document.getElementById("downloadform");
	
	makePageSections();
	
	inputSuggestion($("#inputSection"), "inputbar");
	
	makeSynStack();
});

var term;
var stack;

/* Not including subterms */

function simpleSearch(){

	while(downloadform.firstChild){
		downloadform.removeChild(downloadform.firstChild);
	}
	
	showLoader();

	//get term or its synonym
	term = synStack.getSyn(input.value);
	if(term && term.includes('|')){	
		console.log("IS SYNONYM");
		term = term.split('|')[1]; //term1.mainTerm.name;
	}
	tableform.innerHTML = "Looking for term: " + term ;
	console.log(term);
	
	
	var subterms = document.getElementById("mappedCheckbox").checked;
	if(subterms){
		// fetch subterms
		var pay = JSON.stringify({
			"statements" : [{
				"statement" : "match (n:Term{name:{name}})-[:MAPPED]->(a) return a " , "parameters" : {"name": term}
			}]
		});
		queryNeo4j(pay,findSimpleSubterms);
	}else{
		// fetch search term occurrences
		queryNeo4j(getMentionsPayload(term), simpleSearchOnSuccess);	
	}
}


function simpleSearchOnSuccess(data){
	console.log("Finished Search");

	stack = new ThornStack();

	addTermOrSubterm(data, stack);
	
	showResult();
}



/* Including subterms */

function findSimpleSubterms(data){
	subTerms = [];
	
	$("#mappedResults").append('<button onclick="showSubterms()">Click Here to see Subterms</button>');
	
	var results = data["results"][0];
	var data2 = results["data"];
	stack = new ThornStack();
	
	subTermCount = 0;
	subTermMax = data2.length + 1;
	console.log(subTermMax);
	
	// fetch input term
	queryNeo4j(getMentionsPayload(term),addSimpleSubtermData);
	
	// fetch each subterm 
	for (var i=0; i< data2.length ; i++){
		var name = data2[i]["row"][0]["name"];	
		subTerms.push(name);
		//mappedResults.innerHTML = mappedResults.innerHTML +  " | " + name;		

		queryNeo4j(getMentionsPayload(name),addSimpleSubtermData);			
	}
}


function addSimpleSubtermData(data){
	addTermOrSubterm(data, stack);
	console.log("FINISHED SUBTERM or TERM");
	
	subTermCount++;
	if(subTermCount==subTermMax){
		showResult();
	}
}

/* GENERAL */

function addTermOrSubterm(data){
	var results = data["results"][0];
	var data2 = results["data"];
	for (var i=0; i< data2.length ; i++){
		var name = data2[i]["row"][0]["name"];
		var type = data2[i]["row"][0]["type"];
		var stype = data2[i]["row"][0]["stype"];
		var date = data2[i]["row"][1]["date"];
		var pmid = data2[i]["row"][1]["pmid"];
		var title = data2[i]["row"][1]["title"];
		
		var check = stack.get(name);

		if(!check){
			var newTerm = new Term(name,type,stype);
			var isDrug = data2[i]["row"][0]["isDrug"];
			if(isDrug=="true"){newTerm.isDrug=true;}
			stack.add(name,newTerm);
			newTerm.addArt(pmid,date,stack,title);
		}else{			
			check.addArt(pmid,date,stack,title);
		}	
	}
}

function showResult(){
	$("#loader").remove();
	makeFilters(stack, input.value);
	makeTables(stack, tableLimit, 0, "connected");
	makeDownloadableCSV(input.value, stack);
}

function getMentionsPayload(name){
	return JSON.stringify({
		"statements" : [{
			"statement" : "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m) return m, a " , "parameters" : {"name": name}
		}]
	});
}