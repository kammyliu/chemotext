SEARCH_TYPE = "connected";

var input;
$(document).ready(function(){	
	makePageSections();
	
	inputSuggestion($("#inputSection"), "inputbar");
	input = document.getElementById("inputbar");
		window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
		window.requestFileSystem(window.TEMPORARY, 5*1024*1024, function(fs){
			var fileName = "sorted.js";
	fs.root.getFile(fileName,{create:true}, function(fileEntry){
		fileEntry.createWriter(function(fileWriter){
			var data = termBank.sort(function(a,b){
				if (a.includes('|')){
					a = a.split('|')[0];
				} 
								if (b.includes('|')){
					b = b.split('|')[0];
				} 
				 if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }

  // names must be equal
  return 0;
				});
			
			
			
			fileWriter.addEventListener("writeend", function() {
				window.open("filesystem:http://chemotext.mml.unc.edu/temporary/"+fileName);
			}, false);
			var blob = new Blob([data],{type: 'text/plain'});
			fileWriter.write(blob);
			console.log("WRITTEN");
		},errorHandler);
	},errorHandler);
	
			}, errorHandler);
		
	
	
});

var _withSubterms = false;
//var _subterms declared in chemotext.js

function simpleSearch(){
	if (input.value == "") return;

	$(displayText).text("");
	$("#results").hide();
	$("#show-subterms").hide();
	showLoader();

	var term = termBank.getSynonym(getDataIndex(input));
	
	//console.log("Term: "+term);

	_withSubterms = subtermsCheckbox.checked;
	if(_withSubterms){
		queryNeo4j(getMentionsWithSubtermsPayload(term), simpleSearchOnSuccess);	// search term and subterm co-occurrences
	}else{
		queryNeo4j(getMentionsPayload(term), simpleSearchOnSuccess);	// fetch search term co-occurrences
	}
}

/* Not including subterms */

function simpleSearchOnSuccess(data){
	//console.log(data);

	var results = readResults(data, _withSubterms);

	showResult(results, input.value, _withSubterms);
}

/* Show results table */
function makeConnectedTermsTable(stack, index, indexLimit){
	var $tbody = $(tableform).find("tbody");

	/*append TR: 
		<tr>
			<td>name</td>
			<td>
				<button type="button" class="articleButton">count</button>
			</td>
		</tr>
	*/
	for(var i=index;i<indexLimit;i++){
		var term = stack[i];
		$tr = $("<tr/>");
		$tr.append('<td>'+term.name+'</td>');
		$buttonTd = $("<td/>").append( $("<button/>", {
			type: "button", 
			"class": "articleButton", 
			text: term.articles.length, 
			click: function(term){ return function(){openArticleList(term);} }(term)
		}));
		$tbody.append($tr.append($buttonTd));		
	}	
	return;
}


