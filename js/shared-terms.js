var isShared = true;

var thepage, input, input2, tableform, downloadform;

$(document).ready(function(){	
	makePageSections();

	inputSuggestion($("#inputSection"), "inputbar");
	inputSuggestion($("#inputSection2"), "inputbar2");
	
	thepage = document.getElementById("thepage");
	input = document.getElementById("inputbar");
	input2 = document.getElementById("inputbar2");
	tableform = document.getElementById("tableform");
	downloadform = document.getElementById("downloadform");
	
	makeSynStack();
});

var sharedTerm1;
var sharedTerm2;
function sharedSearch(){
	isShared = true
	isPath = false;
	
	$("#term1-label").text(input.value);
	$("#term2-label").text(input2.value);
	
	while(downloadform.firstChild){
		downloadform.removeChild(downloadform.firstChild);
	}
	
	showLoader();
	
	var term = input.value;
	var term1 = synStack.get(term);
	console.log(term1)	
	if(term1 && term1.includes('|')){
		term1 = term1.split('|');
		term1 = term1[1]; //term1.mainTerm.name;
	}

	var term2 = input2.value;
	var termObj = synStack.get(term2);
	if(termObj && termObj.includes("|")){
		termObj = termObj.split('|');
		term2 = termObj[1]; //termObj.mainTerm.name;
	}
	
	tableform.innerHTML = "Looking for term: " + term1;
	
	var checkbox = document.getElementById("mappedCheckbox");
	if(checkbox.checked){
		sharedTerm1 = term1;
		sharedTerm2 = term2;
		var pay = JSON.stringify({
			"statements" : [{
				"statement" : "match (n:Term{name:{name}})-[:MAPPED]->(a) return a " , "parameters" : {"name": term1}
			}]
		});
		queryNeo4j(pay,findSharedSubTermsOne);
	}else{
		var payload1 = JSON.stringify({
			"statements" : [{
				"statement" : "match (n:Term{name:{name1}})-[:MENTIONS]-(a)-[:MENTIONS]-(m) return m, a " ,
				"parameters" : {"name1": term1}
			}]
		});
		var payload2 = JSON.stringify({
			"statements" : [{
				"statement" : "match (n:Term{name:{name2}})-[:MENTIONS]-(a)-[:MENTIONS]-(b) return b, a " ,
				"parameters" : {"name2":term2}
			}]
		});
		sharedPayload = payload2;
		queryNeo4j(payload1,sharedSearchOne);
	}	
}

var sharedStack;	
var sharedPayload;
function sharedSearchOne(data){
	var stack = new ThornStack();
	var results = data["results"][0];
	var data2 = results["data"];
	
	for (var i=0; i< data2.length; i++){
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
	sharedStack = stack;
	queryNeo4j(sharedPayload,sharedSearchTwo);
}	

function findSharedSubTermsOne(data){
	var mappedResults = document.getElementById("mappedResults");
	mappedResults.innerHTML = "Terms:";
	var results = data["results"][0];
	var data2 = results["data"];
	sharedStack = new ThornStack();
	
	subTermCount = 0;
	subTermMax = data2.length + 1;
	console.log(subTermMax);
	var payload = JSON.stringify({
			"statements" : [{
				"statement" : "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m) return m, a " , "parameters" : {"name": sharedTerm1}
			}]
		});
	queryNeo4j(payload,addSharedSubTermsOne);
	
	for (var i=0; i< data2.length ; i++){
		var name = data2[i]["row"][0]["name"];	
		//mappedResults.innerHTML = mappedResults.innerHTML +  " | " + name;		
		subTerms.push(name);
		var payload = JSON.stringify({
			"statements" : [{
				"statement" : "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m) return m, a " , "parameters" : {"name": name}
			}]
		});
		queryNeo4j(payload,addSharedSubTermsOne);			
	}
}

function addSharedSubTermsOne(data){
	
	var results = data["results"][0];
	var data2 = results["data"];
	var stack = sharedStack;
	
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
	subTermCount++;
	
	if(subTermCount>subTermMax){
		console.log("GREATER:"+subTermCount);
	}else if(subTermCount==subTermMax){
		var pay = JSON.stringify({
			"statements" : [{
				"statement" : "match (n:Term{name:{name}})-[:MAPPED]->(a) return a " , "parameters" : {"name": sharedTerm2}
			}]
		});
		queryNeo4j(pay,findSharedSubTermsTwo);
	}
}

function sharedSearchTwo(data){
	var stack = sharedStack;
	console.log("Finished Search2");

	var results = data["results"][0];
	var data2 = results["data"];
	var newstack = new ThornStack();
	for (var i=0; i< data2.length ; i++){
		var name = data2[i]["row"][0]["name"];
		var type = data2[i]["row"][0]["type"];
		var stype = data2[i]["row"][0]["stype"];
		var date = data2[i]["row"][1]["date"];
		var pmid = data2[i]["row"][1]["pmid"];
		var title = data2[i]["row"][1]["title"];

		var check = stack.get(name);	
		if(check){
			var check2 = newstack.get(name);
			if(!check2){
				check = check.sharedCopy();
				newstack.add(name,check);
				check.addArtShared(pmid,date,newstack,title);
			}else{
				check2.addArtShared(pmid,date,newstack,title);
			}
		}	
	}
	stack = newstack;
	
	var loader = document.getElementById("loader");
	thepage.removeChild(loader);
	
	makeFilters(stack,input.value+"_"+input2.value);
	makeTables(stack,tableLimit);
	makeDownloadableCSV(input.value+"_"+input2.value,stack);
}

function findSharedSubTermsTwo(data){
	
	var mappedResults = document.getElementById("mappedResults");
	
	var button = document.createElement("button");
	mappedResults.appendChild(button);
	button.onclick = showSubterms;
	button.innerHTML = "Click Here to see Subterms";
	
	var results = data["results"][0];
	var data2 = results["data"];
		
	subTermCount = 0;
	subTermMax = data2.length + 1;
	console.log(subTermMax);
	
	var payload = JSON.stringify({
			"statements" : [{
				"statement" : "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m) return m, a " , "parameters" : {"name": sharedTerm2}
			}]
		});
	queryNeo4j(payload,addSharedSubTermsTwo);
	
	for (var i=0; i< data2.length ; i++){
		var name = data2[i]["row"][0]["name"];	
		subTerms.push(name);	

		var payload = JSON.stringify({
			"statements" : [{
				"statement" : "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m) return m, a " , "parameters" : {"name": name}
			}]
		});
		queryNeo4j(payload,addSharedSubTermsTwo);			
	}
}

function addSharedSubTermsTwo(data){
	var results = data["results"][0];
	var data2 = results["data"];
	var stack = sharedStack;
	
	var results = data["results"][0];
	var data2 = results["data"];
	var newstack = new ThornStack();
	for (var i=0; i< data2.length ; i++){
		var name = data2[i]["row"][0]["name"];
		var type = data2[i]["row"][0]["type"];
		var stype = data2[i]["row"][0]["stype"];
		var date = data2[i]["row"][1]["date"];
		var pmid = data2[i]["row"][1]["pmid"];
		var title = data2[i]["row"][1]["title"];

		
		var check = stack.get(name);	
		if(check){
			var check2 = newstack.get(name);
			if(!check2){
				check = check.sharedCopy();
				newstack.add(name,check);
				check.addArtShared(pmid,date,newstack,title);
			}else{
				check2.addArtShared(pmid,date,newstack,title);
			}
		}	
	}
	
	console.log("FINISHED SUBTERM or TERM2");
	subTermCount++;
	if(subTermCount==subTermMax){
		stack = newstack;
		console.log(subTermCount);
		
		makeFilters(stack,input.value);
		makeTables(stack,tableLimit);
		makeDownloadableCSV(input.value,stack);
	}
}

	
/* before: true = remove those before the date, false = remove those after the date */
function filterDateShared(stack, year, month, day, removeBefore){
	var toFilter = removeBefore ? nodeDateBefore : nodeDateAfter;
	
	var benchmark = new Date(year,month,day).getTime();
	var term = stack.first;
	while(term != null){
		for(var i =0;i<term.stack1.length;i++){
			if (toFilter(benchmark, term.stack1[i]){
				term.sharedCount1--;				
			}
		}
		term = term.right;
	}
	
	var term = stack.first;
	while(term != null){
		for(var i =0;i<term.stack2.length;i++){
			var node = term.stack2[i]
			if (toFilter(benchmark, term.stack2[i]){
				term.sharedCount2--;				
			}
		}
		term = term.right;
	}
}
