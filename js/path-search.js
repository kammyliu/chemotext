SEARCH_TYPE = "path-subresults";	//second step is type "path-final-results"

var input, selectBar;

$(document).ready(function(){	
	makePageSections();

	makeAutocomplete($("#inputSection"), "inputbar", "GAK protein, human");
	
	makeTypeDropdown("selectBar", false);
	makeTypeDropdown("triType", false);

	input = document.getElementById("inputbar");
	selectBar = document.getElementById("selectBar");	
	
	addExampleLink();
});

var _withSubterms = false;
var _checkedTerms = [];	
//var _subterms declared in chemotext.js

/* Executes the first part of the search */
function triangleSearch(){
	if (input.value == "") return;
		
	$(displayText).text("");
	$("#selections").text("");
	$("#results").hide();
	$("#show-subterms").hide();
	showLoader();
	$("#path-subresults").hide();

	var termA = termBank.getSynonym(input.value);
	var type = selectBar.value;
	
	_withSubterms = subtermsCheckbox.checked;
	if(_withSubterms){
		queryNeo4j(getMentionsWithSubtermsPayload(termA, type), triangleSearchOnSuccess);
	}else{
		queryNeo4j(getMentionsPayload(termA, type), triangleSearchOnSuccess);
	}	
}

/* Callback for receiving the query results (of the first part of the search) */
function triangleSearchOnSuccess(data){	
	var results = readResults(data, _withSubterms);
	showSubresults(results);
}	

/* Show the results for the first part of the search */
function showSubresults(results){
	_checkedTerms = [];
	if(results.length==0){
		$(displayText).text("No Results");
		$("#loader").hide();
		return;
	}
	if (_withSubterms){
		$("#show-subterms").show();
	}
	SEARCH_TYPE = "path-subresults";
	makeTables(results,tableLimit,0);

	$(loader).hide();
	$("#results").show();
	$("#path-subresults").show();
	$("#downloadform").hide();
	$("#selections").text("Choose the Intermediary Terms you want to search with");
	setFinishSearchHandler();	
}

/* Executes the final part of the search */
function setFinishSearchHandler(){
	var selectBar2 = document.getElementById("triType");
	var button = document.getElementById("finish-search");
	button.onclick = function(){
		if (_checkedTerms.length == 0){
			return;
		}
		showLoader()
		$("#results").hide();
	
		var checkedString = "Your Intermediary Terms: ";
		var csvName = "";
		for (var i=0; i< _checkedTerms.length; i++){
			checkedString += _checkedTerms[i] + ", ";
			csvName += "_" + _checkedTerms[i];
		}
		checkedString += "<br>Your Final Term Type: " + selectBar2.value;
		$("#selections").html(checkedString);
		getFinalTerms(_checkedTerms, selectBar2.value, csvName);
	};
}

/* Request the final result terms, using the list of selected terms and the filter type */
function getFinalTerms(terms, type, csvName){		
	var payload = getMentionsFromListPayload(terms, type);	
	queryNeo4j(payload, function(data,xhr,status){
		var results = readResults(data, false);
		SEARCH_TYPE = "path-final-results";
		$("#results").hide();
		showResult(results, input.value+"_Path"+csvName, _withSubterms);
		$("#path-subresults").hide();
		$("#downloadform").show();
		$("#show-subterms").hide();
	 });
}

/* Build the table for showing results of the first step */
function makePathSubresultsTable(stack, index, indexLimit){
	var $tbody = $(tableform).find("tbody");
	$(tableform).find("tr").remove();	
	$tbody.append('<tr><th></th><th>Terms</th><th>Count</th></tr>');
	
	/*append TR: 
		<tr>
			<td>
				<input type="checkbox" [checked] name="name">		
			</td>
			<td>name</td>
			<td>
				<button type="button" class="articleButton">count</button>
			</td>
		</tr>
	*/

	for(var i=index;i<indexLimit;i++){
		var term = stack[i];
		$tr = $("<tr/>");
		$tr.append('<td><input '+
			(_checkedTerms.indexOf(term.name) >-1 ?'checked ':'') +
			'type="checkbox" name="'+term.name+'"></td>');
		$tr.append('<td>'+term.name+'</td>');
		$tr.append('<td>'+term.articles.length+'</td>');
		$tbody.append($tr);
	}
	
	// used to make checks persistent when the table is rebuilt (from paging)
	$("td input[type='checkbox']").click(function(){
		if (this.checked){
			_checkedTerms.push(this.name);
		} else {
			var index = _checkedTerms.indexOf(this.name);
			if (index>-1){
				_checkedTerms.splice(index, 1);
			}
		}
	});
}	

/* Build the table for showing final results */
function makePathFinalResultsTable(stack, index, indexLimit){
	$(tableform).find("tr").remove();	
	var $tbody = $(tableform).find("tbody");
	$tbody.append('<tr><th>Terms</th><th>Count</th></tr>');
	
	/*append TR: 
		<tr>
			<td>name</td>
			<td>
				<button type="button" class="articleButton">count</button>
			</td>
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
		$tbody.append($tr.append($buttonTd));
	}
}