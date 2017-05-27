SEARCH_TYPE = "article";

var articleBar, termsList, searchbutton;

$(document).ready(function(){	
	makePageSections();

	inputSuggestion($("#inputSection"), "articleBar");
	articleBar = document.getElementById("articleBar");
	termsList = document.getElementById("terms-list");
	searchbutton = document.getElementById("search-button");
	
	$("#add-term-button").click(function(){
		if(articleBar.value!=""){
			searchbutton.disabled = false;
			addToArticleArray()
		}
	});
	
	makeSynStack();
});



function addToArticleArray(){	
	var term = getSelfOrSynonym(articleBar.value);
	$(termsList).append('<li><span>'+term+'</span><button type="button" onclick="deleteFromArticleArray(this)">X</button></li>');
	
	articleBar.value = "";
}


function deleteFromArticleArray(button){
	$(button).parent().remove();
	if ($(termsList).children().length == 0){
			searchbutton.disabled = true;		
	}
	//console.log("Delete");
}

function articleSearch(){
	$(displayText).text("");
	$("#results").hide();
	$("#loader").show();
	
	var articleArray = [];
	$(termsList).find("span").each(function(i, el){
		articleArray.push($(this).text());
	});
	
	var matchStr = "match (n:Term {name:{name0}})-[]-(a)";
	var params = { "name0" : articleArray[0] };
	for(var i =1;i<articleArray.length;i++){
		var name = "name"+i;
		params[name] = articleArray[i];
		matchStr = matchStr + " match (n"+articleArray[i]+":Term {name:{"+name+"}})-[:MENTIONS]-(a)";
	}
	var data = JSON.stringify({
			"statements" : [{
				"statement" : matchStr+" return a;", 
				"parameters" : params
			}]
     });
	 
	 
	 queryNeo4j(data, function(data,xhr,status){
		console.log("Finished Search");
		console.log(data);
		//tableform.innerHTML = JSON.stringify(data);
		var data = data["results"][0]["data"];
		var stack = new ThornStack(false);
		for(var i=0;i<data.length;i++){
			var date = data[i]["row"][0]["date"];
			var pmid = data[i]["row"][0]["pmid"];
			var title = data[i]["row"][0]["title"];

			var art = new Art(pmid,date,title);
			stack.add(pmid,art);
		}
		
		showResult(stack, "", false, SEARCH_TYPE);
		//console.log(stack.length);
		//makeTables(stack,tableLimit);
		//makeFilters(stack,"articles");
	 });
	 
	
}


function makeArticleSearchTable(stack, index, indexLimit){

	var $tbody = $("#tableform").find("tbody");


	/*append TR: 
		<tr>
			<td>
				<a href="url">pmid</a>
			</td>
		</tr>
	*/
	for(var j=index;j<indexLimit;j++){
		var pmid = stack.list[j];
		$tbody.append('<tr><td><a href="http://www.ncbi.nlm.nih.gov/pubmed/'+pmid+'">'
			+pmid+'</a></td></tr>');
	}
}
	


	


