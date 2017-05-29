SEARCH_TYPE = "shared";

var input, input2;
$(document).ready(function(){	
	makePageSections();

	inputSuggestion($("#inputSection"), "inputbar2");	//2 first because it prepends
	inputSuggestion($("#inputSection"), "inputbar");
	
	input = document.getElementById("inputbar");
	input2 = document.getElementById("inputbar2");
});


// fields specific to each search execution
var _term1, _term2, _stack;
var _newStack;	//only used with subterms. stack for building Term 2 + subterms results

var _withSubterms = false;
var _subtermMax;
var _finishedSubterms=0;
//var _subterms declared in chemotext.js

function sharedSearch(){
	if (input.value == "" || input2.value == "") return;
	
	$(displayText).text("");
	$("#results").hide();
	$("#show-subterms").hide();
	showLoader();
	
	// labels in table header
	$("#term1-label").text(input.value);
	$("#term2-label").text(input2.value);
	
	_term1 = getSelfOrSynonym(input.value);
	_term2 = getSelfOrSynonym(input2.value);
	_stack = new ThornStack();
		
	_withSubterms = subtermsCheckbox.checked;
	if(_withSubterms){
		queryNeo4j(getSubtermsPayload(_term1), findSharedSubTermsOne);
	}else{
		queryNeo4j(getMentionsPayload(_term1), sharedSearchOne);
	}	
}


/* Not including subterms */

function sharedSearchOne(data){
	console.log("Finished query term 1");
	addTermOrSubterm(_stack, data);
	queryNeo4j(getMentionsPayload(_term2),sharedSearchTwo);
}	

function sharedSearchTwo(data){
	console.log("Finished query term 2");
	
	var newStack = new ThornStack();
	addSharedTermOrSubterm(_stack, newStack, data);
	_stack = newStack;
	
	//console.log(_stack);
	showResult(_stack, input.value+"_"+input2.value, _withSubterms);
}


/* Including subterms */

function findSharedSubTermsOne(data){	
	var results = data["results"][0]["data"];

	_subterms = [];	
	_subtermMax = results.length + 1;	//all subterms plus the original term
	_finishedSubterms = 0;
	
	queryNeo4j(getMentionsPayload(_term1), addSharedSubTermsOne);
	
	for (var i=0; i< results.length ; i++){
		var name = results[i]["row"][0]["name"];	
		_subterms.push(name);
		queryNeo4j(getMentionsPayload(name), addSharedSubTermsOne);			
	}
}

function addSharedSubTermsOne(data){		
	addTermOrSubterm(_stack, data);
	
	_finishedSubterms++;
	if(	_finishedSubterms == _subtermMax){
		console.log("Finished query term 1");
		
		_newStack = new ThornStack();
		queryNeo4j(getSubtermsPayload(_term2), findSharedSubTermsTwo);
	}
}

function findSharedSubTermsTwo(data){
	var results = data["results"][0]["data"];

	_finishedSubterms = 0;
	_subtermMax = results.length + 1;
	
	queryNeo4j(getMentionsPayload(_term2), addSharedSubTermsTwo);
	
	for (var i=0; i< results.length ; i++){
		var name = results[i]["row"][0]["name"];	
		_subterms.push(name);	
		queryNeo4j(getMentionsPayload(name),addSharedSubTermsTwo);			
	}
}


function addSharedSubTermsTwo(data){
	addSharedTermOrSubterm(_stack, _newStack, data);
	
	//console.log(_stack);
	
	_finishedSubterms++;
	if(_finishedSubterms == _subtermMax){
		_stack = _newStack;
		console.log("Finished query term 2");
		showResult(_stack, input.value+"_"+input2.value, _withSubterms);
	}
}


/* helper that adds a term to the stack */
function addSharedTermOrSubterm(stack, newstack, data){
	//console.log(stack);
	var data2 = data["results"][0]["data"];
	
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
			//console.log(check2);
			if(!check2){
				check = check.sharedCopy();
				newstack.add(name,check);
				check.addArtShared(pmid,date,newstack,title);
			}else{
				check2.addArtShared(pmid,date,newstack,title);
			}
		}	
	}	
	//console
}





function makeSharedTermsTable(stack, index, indexLimit){
	
	//skip up to 'index'
	var node = stack.first;
	for(var i=0;i<index;i++){
		node = node.right;	
	}
	
	/*append TR: 
		<tr>
			<td>name</td>
			<td>
				<button type="button" class="articleButton">count</button>
			</td>
			<td>term1 count</td>
			<td>term2 count</td>
		</tr>
	*/
	var $tbody = $(tableform).find("tbody");
	for(var j=index;j<indexLimit;j++){
		if (node == null) break;
		
		$tr = $("<tr/>");
		$tr.append('<td>'+node.name+'</td>');
		$buttonTd = $("<td/>").append( $("<button/>", {
			type: "button", 
			"class": "articleButton", 
			text: node.count, 
			click: function(node){ return function(){openArticleList(node);} }(node)
		}));
		$tr.append($buttonTd);
		$tr.append('<td>'+node.sharedCount1+'</td>');
		$tr.append('<td>'+node.sharedCount2+'</td>');
		$tbody.append($tr);
		
		node = node.right;
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
