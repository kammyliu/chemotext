SEARCH_TYPE = "shared";

var input, input2;
$(document).ready(function(){	
	makePageSections();

	makeAutocomplete($("#inputSection"), "inputbar2", "gefitinib");	//2 first because it prepends
	makeAutocomplete($("#inputSection"), "inputbar", "GAK protein, human");
	
	input = document.getElementById("inputbar");
	input2 = document.getElementById("inputbar2");
	
	addExampleLink();
});

var _withSubterms = false;
//var _subterms declared in chemotext.js

/* Executes the search */
function sharedSearch(){
	if (input.value == "" || input2.value == "") return;
	
	$(displayText).text("");
	$("#results").hide();
	$("#show-subterms").hide();
	showLoader();
	
	// labels in table header
	$("#term1-label").text(input.value);
	$("#term2-label").text(input2.value);
	
	var term1 = termBank.getSynonym(input.value);
	var term2 = termBank.getSynonym(input2.value);
		
	_withSubterms = subtermsCheckbox.checked;
	if(_withSubterms){
		queryNeo4j(getSharedMentionsWithSubtermsPayload(term1, term2), sharedSearchOnSuccess);
	}else{
		queryNeo4j(getSharedMentionsPayload(term1, term2), sharedSearchOnSuccess);
	}	
}

/* Return the Cypher query for this search */
function getSharedMentionsPayload(term1, term2){
	return JSON.stringify({
		"statements" : [
			{
				"statement":
					"MATCH (:Term{name:{name1}})-[:MENTIONS]-(article1)-[:MENTIONS]-(term) "+
					"MATCH (term)-[:MENTIONS]-(article2)-[:MENTIONS]-(:Term{name:{name2}}) "+
					"WITH term, collect(distinct article1) as a1, collect(distinct article2) as a2 "+
					"WITH term, filter(x in a1 where x in a2) as shared, a1, a2 " +
					"RETURN term, shared, size(a1)-size(shared) as count1, size(a2)-size(shared) as count2 "+
					"ORDER BY size(shared) DESC, count1+count2 DESC",
				"parameters" : {"name1": term1, "name2": term2}
			}
		]
	});
}

/* Return the Cypher query for this search, with subterms */
function getSharedMentionsWithSubtermsPayload(term1, term2){
	return JSON.stringify({
		"statements" : [
			{
				"statement":
					// get subterms for term1 and term2
					"MATCH (term1:Term{name:{name1}}) " +
					"MATCH (term2:Term{name:{name2}}) " +
					"OPTIONAL MATCH (term1)-[:MAPPED]->(subterm1) " +
					"OPTIONAL MATCH (term2)-[:MAPPED]->(subterm2) " +
					"WITH collect(distinct subterm1.name)+{name1} as subtermList1, collect(distinct subterm2.name)+{name2} as subtermList2 " + 

					// match input term or a subterm
					"MATCH (n1:Term)-[:MENTIONS]-(article1)-[:MENTIONS]-(term) "+
					"WHERE n1.name in subtermList1 " +
					"MATCH (term)-[:MENTIONS]-(article2)-[:MENTIONS]-(n2:Term) "+
					"WHERE n2.name in subtermList2 " +

					"WITH term, collect(distinct article1) as a1, collect(distinct article2) as a2 "+
					"WITH term, filter(x in a1 where x in a2) as shared, a1, a2 " +
					"RETURN term, shared, size(a1)-size(shared) as count1, size(a2)-size(shared) as count2 "+
					"ORDER BY size(shared) DESC, count1+count2 DESC",
				"parameters" : {"name1": term1, "name2": term2}
			},
			{
				"statement": 
					"OPTIONAL MATCH (:Term{name:{name1}})-[:MAPPED]->(subterm1) "+
					"OPTIONAL MATCH (:Term{name:{name2}})-[:MAPPED]->(subterm2) "+
					"RETURN collect(distinct subterm1.name)+collect(distinct subterm2.name)",
				"parameters" : {"name1": term1, "name2": term2}
			}	
		]
	});
}

/* Callback for receiving search results */
function sharedSearchOnSuccess(data){
	//console.log(data);
	var results = readResults(data, _withSubterms, true);
	showResult(results, input.value+"_"+input2.value, _withSubterms);
}	

/* Build the results table */
function makeSharedTermsTable(stack, index, indexLimit){
	var $tbody = $(tableform).find("tbody");

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
	for(var j=index;j<indexLimit;j++){
		var node = stack[j];

		$tr = $("<tr/>");
		$tr.append('<td>'+node.name+'</td>');
		$buttonTd = $("<td/>").append( $("<button/>", {
			type: "button", 
			"class": "articleButton", 
			text: node.articles.length, 
			click: function(node){ return function(){openArticleList(node);} }(node)
		}));
		$tr.append($buttonTd);
		$tr.append('<td>'+node.sharedCount1+'</td>');
		$tr.append('<td>'+node.sharedCount2+'</td>');
		$tbody.append($tr);
		
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
