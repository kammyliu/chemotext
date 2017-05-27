var isPath = true;
var countER = 6;

var input, selectBar;

$(document).ready(function(){	
	makePageSections();

	inputSuggestion($("#inputSection"), "inputbar");
	
	makeSTypes("selectBar", false);
	makeSTypes("triType", false);

	input = document.getElementById("inputbar");
	selectBar = document.getElementById("selectBar");
	
	makeSynStack();
});

var _subterms; //flag for if subterms are included

var triangleTerm;
function triangleSearch(){
	tableform = document.getElementById("subresults-tableform");

	$(displayText).text("");
	$("#results").hide();
	$("#show-subterms").hide();
	$("#loader").show();
	$("#partial-results").show();
	
	var term = getSelfOrSynonym(input.value);
	var type = selectBar.value;
	
	console.log(term);
	console.log(type);	
	
	_subterms = checkbox.checked;
	if(_subterms){
		triangleTerm = term;
		queryNeo4j(getSubtermsPayload(term),findTriangleSubTerms);	
	}else{
		var data;
		if(type == "Disease" || type == "Other" || type == "Chemical"){
			data = JSON.stringify({				
				"statements" : [{
					"statement" : "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m:Term{type:{type}}) return m, a",
					"parameters" : {"name": term, "type":type}
				}]			
			});		
		}else{
			data = JSON.stringify({
				"statements" : [{
					"statement" : "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m:Term{stype:{type}}) return m, a",
					"parameters" : {"name": term, "type":type}
				}]			
			});
		}
		
		queryNeo4j(data,triangleSearchOnSuccess);
	}	
}
	
function triangleSearchOnSuccess(data){
	console.log("Finished Search");
	
	var stack = new ThornStack();
		
	addTermOrSubterm(stack, data);
	
	$(loader).hide();
	$("#path-subresults").show();
	
	tableform = document.getElementById("tableform");
	makeTables(stack,tableLimit,0, "path-subresults");
		
	var newStack = new ThornStack();
	
	setFinishSearchHandler();
	
}	
	
function setFinishSearchHandler(){
	var selectBar2 = document.getElementById("triType");
	
	var button = document.getElementById("finish-search");
	button.onclick = function(){
		isPath = false;
		var checkedTerms = [];
		var checkedString = "Your B Terms: ";
		var term = stack.first;
		var csvName = "";
		for(var i=0; i <stack.length;i++){
			if(term.isSelected){
				checkedTerms.push(term);
				checkedString = checkedString + term.name + ", ";
				csvName = csvName + "_" + term.name;
			}
			if(term.right==null){
				break;
			}
			term = term.right;
		}
		//checkedString = checkedString + " Your C Term Type: " + selectBar2.value;
		$("#b-terms").text(checkedString);
		countER = checkedTerms.length;
		console.log(countER);
		for(var j=0;j<checkedTerms.length;j++){
			console.log("Post Request");
			term = checkedTerms[j];
			postRequest(term.name,selectBar2.value,newStack,countER,csvName)
		}
	};
}
	
	/*
function addTriangleSubTerms(data){
	var stack = simpleStack;
	
	addTermOrSubterm(stack, data);
	
	console.log("FINISHED SUBTERM or TERM");
	subTermCount++;
	
	if(subTermCount==subTermMax){
		stack = simpleStack;
		
		tableform = document.getElementById("tableform");
		makeTables(stack,tableLimit,0);
	
		var newStack = new ThornStack();
		setFinishSearchHandler();
	}
	}*/

function findTriangleSubTerms(data){
	subTerms = [];
	subTermCount = 0;
	subTermMax = data["results"][0]["data"].length + 1;
	
	simpleStack = new ThornStack();
	
	queryNeo4j(getMentionsPayload(triangleTerm),addSimpleSubtermData);
	
	for (var i=0; i< data2.length ; i++){
		var name = data2[i]["row"][0]["name"];	
		subTerms.push(name);
		queryNeo4j(getMentionsPayload(name),addSimpleSubtermData);			
	}	
}


function postRequest(term,type,stack,count,csvName){
	var input = document.getElementById("inputbar");
	var tableform = document.getElementById("tableform");
	var selectBar = document.getElementById("selectBar");
	var downloadform = document.getElementById("downloadform");
	
	var data = "";
	if(type == "Disease" || type == "Other" || type == "Chemical"){		
		data = JSON.stringify({		
			"statements" : [{
				"statement" : "match (n:Term{name:{name}})-[]-(a)-[]-(m:Term{type:{type}}) return m, a" , "parameters" : {"name": term, "type":type}
			}]       
		});
	}else{
		data = JSON.stringify({			
			"statements" : [{
				"statement" : "match (n:Term{name:{name}})-[]-(a)-[]-(m:Term{stype:{type}}) return m, a" , "parameters" : {"name": term, "type":type}
			}]       
		});
	}
		
	$.ajax({ //443 works.
		url: "http://chemotext.mml.unc.edu:7474/db/data/transaction/commit",			
		accepts: "application/json; charset=UTF-8",
		dataType:"json",
		contentType:"application/json",		
		data: data,
		type:"POST",
		success:function(data,xhr,status)
		{
			console.log("Finished Search");

			addTermOrSubterm(stack, data);
			
			countER--;
			$(displayText).text("Percent Done: " + (100-(countER*20))); 
			//console.log("Count: "+countER);
			if(countER==0){
				console.log("FINISHED: "+stack.length)

				makeTables(stack,tableLimit,0,"connected");
				makeDownloadableCSV(input.value+"_Path"+csvName,stack);
			}	
		 },
		error:function(xhr,err,msg){
			console.log(err+": "+msg);	
		}
	});
}

function makePathSubresultsTable(stack, index, indexLimit){
	//skip up to 'index'
	var node = stack.first;
	for(var i=0;i<index;i++){
		node = node.right;	
	}
	
	/*append TR: 
		<tr>
			<td class="countCol">
				<input type="checkbox" [checked] name="name">		
			</td>
			<td>name</td>
			<td class="countCol">
				<button type="button" class="articleButton">count</button>
			</td>
		</tr>
	*/
	var $tbody = $("#tableform").find("tbody");
	for(var j=index;j<indexLimit;j++){
		if (node == null) break;
		
		$tr = $("<tr/>");
		$tr.append('<td class="countCol"><input '+
			node.isSelected?'checked ':'' +
			'type="checkbox" name="'+node.name+'"></td>');
		$tr.append('<td>'+node.name+'</td>');
		$buttonTd = $("<td/>", {"class": "countCol"}).append( $("<button/>", {
			type: "button", 
			"class": "articleButton", 
			text: node.count, 
			click: function(node){ return function(){openArticleList(node);} }(node)
		}));
		$tr.append($buttonTd);
		$tbody.append($tr);
		
		node = node.right;
	}
	
	$("td input[type='checkbox']").click(function(){
		var term = stack.get(this.name);
		term.isSelected = this.checked;
	});
}	

