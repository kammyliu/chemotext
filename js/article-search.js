var isArticle = true;
var tableform, articleBar, displayText;

$(document).ready(function(){	
	makePageSections();

	inputSuggestion($("#inputSection"), "articleBar");
	
	tableform = document.getElementById("tableform");
	articleBar = document.getElementById("articleBar");
	displayText = document.getElementById("displayText");
		
	$("#add-term-button")[0].onclick = function(){
		var input = document.getElementById("articleBar");
		if(input.value==""){
			//articleSearch();
		}else{
			searchbutton.style.visibility = "visible";
			addToArticleArray()
		}
	}
	
	makeSynStack();
});



function addToArticleArray(){
	
	while(tableform.firstChild){
		tableform.removeChild(tableform.firstChild);
	}
	
	var check = synStack.get(articleBar.value);
	if(check){
		if(check.includes("|")){
			check = check.split("|")[1];
		}

		$(displayText).append('<li><span>'+check+'</span><button type="button" onclick="deleteFromArticleArray(this)">X</button></li>');
	}
	articleBar.value = "";
	// id= articleBar. check to see if Term exists and if it does add to array in memory and list on computer.
}


function deleteFromArticleArray(button){
	
	while(tableform.firstChild){
		tableform.removeChild(tableform.firstChild);
	}
	
	$(button).parent().remove();
	
	//console.log("Delete");
}

function articleSearch(){
	
	if(articleBar.value!=""){
		//addToArticleArray();
	}
	
	var articleArray = $(displayText).find("span").each(function(i, el){
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
				"statement" : matchStr+" return a;" , "parameters" : params
			}]
     });
	 
	//take array, do query, make Tables. and Date Filter.
	$.ajax({ //443 works.
		url: "http://chemotext.mml.unc.edu:7474/db/data/transaction/commit",
		accepts: "application/json; charset=UTF-8",
		dataType:"json",
		contentType:"application/json",
		//headers: { "X-Stream": "false" },
		
		data: data,
		type:"POST",
		success:function(data,xhr,status)
		{
			console.log("Finished Search");
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
			//console.log(stack.length);
			makeTables(stack,tableLimit);
			//makeFilters(stack,"articles");
		 },
		error:function(xhr,err,msg){
			console.log(xhr);
			console.log(err);
			console.log(msg);
			//thepage.removeChild(loader);
			$("#loader").remove();
			tableform.innerHTML = "Connection to Neo4j Database rejected";
		}
	});
}

	


	


