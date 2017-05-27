SEARCH_TYPE = "shared";

var isShared = true; isArticle = false; isPath = false;

var input, input2;

$(document).ready(function(){	
	makePageSections();

	inputSuggestion($("#inputSection"), "inputbar2");	//2 first because it prepends
	inputSuggestion($("#inputSection"), "inputbar");
	
	input = document.getElementById("inputbar");
	input2 = document.getElementById("inputbar2");
	
	makeSynStack();
});

var sharedTerm1;
var sharedTerm2;
var payload2;
var _stack;	
var _subterms; //flag for if subterms are included

function sharedSearch(){
	$("#results").hide();
	$("#show-subterms").hide();
	$("#loader").show();
	
	$("#term1-label").text(input.value);
	$("#term2-label").text(input2.value);
	
	var term1 = getSelfOrSynonym(input.value);
	var term2 = getSelfOrSynonym(input2.value);
		
	_subterms = document.getElementById("mappedCheckbox").checked;
	if(_subterms){
		sharedTerm1 = term1;
		sharedTerm2 = term2;
		queryNeo4j(getSubtermsPayload(term1), findSharedSubTermsOne);
	}else{
		payload2 = getMentionsPayload(term2);
		queryNeo4j(getMentionsPayload(term1), sharedSearchOne);
	}	
}


/* Not including subterms */

function sharedSearchOne(data){
	console.log("Finished Query 1");
	_stack = new ThornStack();
	addTermOrSubterm(data);
	queryNeo4j(payload2,sharedSearchTwo);
}	

function sharedSearchTwo(data){
	console.log("Finished Query 2");

	var newstack = new ThornStack();
	addSharedTermOrSubterm(_stack, newstack, data);
	
	_stack = newstack;
	
	showResult(_stack, input.value+"_"+input2.value, _subterms);
}


/* Including subterms */

/* almost identical to findSimpleSubterms in connected-terms.js */
function findSharedSubTermsOne(data){
	_stack = new ThornStack();
	
	subTerms = [];	
	subTermCount = 0;
	subTermMax = data2.length + 1;
	//console.log(subTermMax);
	
	queryNeo4j(getMentionsPayload(sharedTerm1),addSharedSubTermsOne);
	
	var results = data["results"][0];
	var data2 = results["data"];
	
	for (var i=0; i< data2.length ; i++){
		var name = data2[i]["row"][0]["name"];	
		subTerms.push(name);
		queryNeo4j(getMentionsPayload(name),addSharedSubTermsOne);			
	}
}

function addSharedSubTermsOne(data){		
	addTermOrSubterm(_stack, data);
	//console.log("FINISHED SUBTERM or TERM");
	
	subTermCount++;
	if(subTermCount==subTermMax){
		queryNeo4j(getSubtermsPayload(sharedTerm2), findSharedSubTermsTwo);
	}
}

function findSharedSubTermsTwo(data){
	var results = data["results"][0];
	var data2 = results["data"];
		
	subTermCount = 0;
	subTermMax = data2.length + 1;
	//console.log(subTermMax);
	
	queryNeo4j(getMentionsPayload(sharedTerm2),addSharedSubTermsTwo);
	
	for (var i=0; i< data2.length ; i++){
		var name = data2[i]["row"][0]["name"];	
		subTerms.push(name);	
		queryNeo4j(getMentionsPayload(name),addSharedSubTermsTwo);			
	}
}

function addSharedSubTermsTwo(data){
	var stack = _stack;
	var newstack = new ThornStack();

	addSharedTermOrSubterm(stack, newstack, data);
	
	console.log("FINISHED SUBTERM or TERM2");
	subTermCount++;
	if(subTermCount==subTermMax){
		stack = newstack;
		showResult(stack, input.value+"_"+input2.value, _subterms);
	}
}


function getSelfOrSynonym(string){
	var term = synStack.get(string);
	if(term && term.includes('|')){
		term = term.split('|')[1]; //term.mainTerm.name;
	}
	return term;
}


/* helper that adds an article to the stack */
function addSharedTermOrSubterm(stack, newstack, data){
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
}

	
/* before: true = remove those before the date, false = remove those after the date */
function filterDateShared(stack, year, month, day, removeBefore){
	var toFilter = removeBefore ? nodeDateBefore : nodeDateAfter;
	
	var benchmark = new Date(year,month,day).getTime();
	
	var term = stack.first;
	while(term != null){
		for(var i =0;i<term.stack1.length;i++){
			if (toFilter(benchmark, term.stack1[i])){
				term.sharedCount1--;				
			}
		}
		term = term.right;
	}
	
	var term = stack.first;
	while(term != null){
		for(var i =0;i<term.stack2.length;i++){
			var node = term.stack2[i]
			if (toFilter(benchmark, term.stack2[i])){
				term.sharedCount2--;				
			}
		}
		term = term.right;
	}
}
