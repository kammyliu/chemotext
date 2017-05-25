
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length,c.length);
        }
    }
    return "";
}

class Art{
		constructor(pmid,date,title){
			this.pmid = pmid;
			this.title = title;
			if(date==null){
				this.date = "Unknown";
			}else{
				this.date = date.toString();
				this.year = parseInt(this.date[0] + "" + this.date[1] +"" + this.date[2] + "" + this.date[3]);
				this.month = parseInt(this.date[4] + "" + this.date[5]);
				this.day = parseInt(this.date[6] + "" + this.date[7]);
			}
			
			
			
			
			
		}
	}

class Term {
		constructor(name,type,stype){
			this.name = name;
			this.type = type;
			this.stype = stype;
			this.count = 0;
			var left = null;
			var right = null; 
			this.stack = [];
			this.isDrug = false;
			
			var isSelected = false;
			
			var isSynonym = false;
			var mainTerm = null;
			
			
			this.sharedCount1 = 0;
			this.stack1 = [];
			this.stack2 = [];
			var sharedStack = null;
			this.sharedCount2 = 0;
			this.sharedCountBoth = 0;
		}
		copy(){
			var copy = new Term(this.name,this.type,this.stype);
			copy.count = this.count;
			copy.isDrug = this.isDrug;
			copy.stack = this.stack.slice();
			copy.sharedCount1 = this.sharedCount1;
			copy.stack1 = this.stack1;
			copy.stack2 = this.stack2;
			copy.sharedCount2 = this.sharedCount2;
			return copy;
		}
		sharedCopy(){
			var copy = this.copy();
			copy.sharedCount1 = this.count;
			copy.count = 0;
			copy.sharedStack = new NumStack();
			for(var i=0;i<this.stack.length;i++){
				copy.sharedStack.add(this.stack[i].pmid,this.stack[i]);
			}
			copy.stack1 = this.stack;
			copy.stack = [];
			return copy;
		}
		
		checkPosition(stack){
				var isGoing = true;
				var ccc = 0;
				while(isGoing){
					ccc++;
					
					
					if(this.left==null){
						stack.first = this;
						return;
					}
					if(ccc>stack.length+1){
						console.log("we got a problem here");
						console.log(this.name +  " " + this.count);
						console.log(this.right.name +" " + this.left.name);
						return;
					}
					
					if(this.left.count<this.count){
						
						if(this.right==null){
							stack.end = this.left;
							this.left.right = null;
							this.right = this.left;
							this.left = this.left.left;
							this.right.left = this;
							if(this.left==null){
							}else{
								this.left.right = this;
							}
						}else{
						
							this.right.left = this.left;
							this.left.right = this.right;
							this.right = this.left;
							this.left = this.left.left;
							this.right.left = this;
							if(this.left==null){
							}else{
								this.left.right = this;
							}
						}
					}else{
						
						return;
					}
				}
		}
		
		addArt(pmid,date,stack,title){
				this.count++;
				var art = new Art(pmid,date,title);
				this.stack.push(art);
				this.checkPosition(stack);
		}
		
		addArtShared(pmid,date,stack,title){
			this.sharedCount2++;
			var art = new Art(pmid,date,title);
			this.stack2.push(art)
			if(this.sharedStack.get(pmid)!=false){
				this.stack.push(art);
				this.count++;
				this.checkPosition(stack);
			}
		}
	}
	
class NumStack {
		constructor(){
			this.stack = [];
			this.thornstack = [];
		}
		add(tag,object){
			var chars = tag.toString().split('');
			var length = chars.length;
			var array = this.thornstack;
			for(var i=0;i<length+1;i++){
				if (array.length==0){
					for(var j=0;j<11;j++){
						array.push([]);
					}
				}
				if(i==length){
					array[0] = object;
					//console.log(array);
					this.stack.push(object);
					break;
				}
				var pos = this.chartonum(chars[i]);
				array = array[pos];
			}		
		}
		get(tag){
			var chars = tag.toString().split('');
			var length = chars.length;
			var array = this.thornstack;
			for(var i=0;i<length+1;i++){
				if(array.length==0){
					return false;
				}
				if(i==length){
					
					if(array[0]==[]){
						return false;
					}else{
						return array[0];
					}
				}
				var pos = this.chartonum(chars[i]);
				array = array[pos];
			}
		}
		chartonum(cha){
			if (cha == '0'){ return 1; }
			if (cha == '1'){ return 2; }
			if (cha == '2'){ return 3; }
			if (cha == '3'){ return 4; }
			if (cha == '4'){ return 5; }
			if (cha == '5'){ return 6; }
			if (cha == '6'){ return 7; }
			if (cha == '7'){ return 8; }
			if (cha == '8'){ return 9; }
			if (cha == '9'){ return 10; }
			else{ return 11; }
		}
		
	}
		
class OldThornStack {
		constructor(){
			this.first = null;
			this.end = null;
			this.thornstack = [];
			this.length = 0;
		}
		add(tag,object){
			var chars = tag.split('');
			var length = chars.length;
			var array = this.thornstack;
			for(var i=0;i<length+1;i++){
				if (array.length==0){
					for(var j=0;j<41;j++){
						array.push([]);
					}
				}
				if(i==length){
					array[0] = object;
					if(this.first==null){
						
						this.first = object;
						this.end = object;	
					}else{
						this.end.right = object;
						object.left = this.end;
						this.end = object;
					}
					this.length++;
					object.checkPosition(this); 
					break;
				}
				var pos = this.chartonum(chars[i]);
				array = array[pos];
			}		
		}
		get(tag){
			var chars = tag.split('');
			var length = chars.length;
			var array = this.thornstack;
			for(var i=0;i<length+1;i++){
				if(array.length==0){
					return false;
				}
				if(i==length){
					
					if(array[0]==[]){
						return false;
					}else{
						return array[0];
					}
				}
				var pos = this.chartonum(chars[i]);
				array = array[pos];
			}
		}
		search(tag){
			var chars = tag.split('');
			var length = chars.length;
			var array = this.thornstack;
			for(var i=0;i<length+1;i++){
				if(array.length==0){
					return false;
				}
				if(i==length){
					return this.searchFind(array);
				}
				var pos = this.chartonum(chars[i]);
				array = array[pos];
			}
		}
		searchFind(array){
			for(var i=0;i<array.length;i++){
				if(array[i]==[] || array[i].length==0){
					
				}else if(i==0){
					//console.log(array);
					return array[i];
				}else{
					var check = this.searchFind(array[i]);
					if(check==false){
					}else{
						return check;
					}
				}	
			}
			return false;
		
		}
		
		chartonum(cha){
			if (cha == 'a' || cha == 'A'){ return 1; }
			if (cha == 'b' || cha == 'B'){ return 2; }
			if (cha == 'c' || cha == 'C'){ return 3; }
			if (cha == 'd' || cha == 'D'){ return 4; }
			if (cha == 'e' || cha == 'E'){ return 5; }
			if (cha == 'f' || cha == 'F'){ return 6; }
			if (cha == 'g' || cha == 'G'){ return 7; }
			if (cha == 'h' || cha == 'H'){ return 8; }
			if (cha == 'i' || cha == 'I'){ return 9; }
			if (cha == 'j' || cha == 'J'){ return 10; }
			if (cha == 'k' || cha == 'K'){ return 11; }
			if (cha == 'l' || cha == 'L'){ return 12; }
			if (cha == 'm' || cha == 'M'){ return 13; }
			if (cha == 'n' || cha == 'N'){ return 14; }
			if (cha == 'o' || cha == 'O'){ return 15; }
			if (cha == 'p' || cha == 'P'){ return 16; }
			if (cha == 'q' || cha == 'Q'){ return 17; }
			if (cha == 'r' || cha == 'R'){ return 18; }
			if (cha == 's' || cha == 'S'){ return 19; }
			if (cha == 't' || cha == 'T'){ return 20; }
			if (cha == 'u' || cha == 'U'){ return 21; }
			if (cha == 'v' || cha == 'V'){ return 22; }
			if (cha == 'w' || cha == 'W'){ return 23; }
			if (cha == 'x' || cha == 'X'){ return 24; }
			if (cha == 'y' || cha == 'Y'){ return 25; }
			if (cha == 'z' || cha == 'Z'){ return 26; }
			if (cha == '0'){ return 27; }
			if (cha == '1'){ return 28; }
			if (cha == '2'){ return 29; }
			if (cha == '3'){ return 30; }
			if (cha == '4'){ return 31; }
			if (cha == '5'){ return 32; }
			if (cha == '6'){ return 33; }
			if (cha == '7'){ return 34; }
			if (cha == '8'){ return 35; }
			if (cha == '9'){ return 36; }
			if (cha == ','){ return 37; }
			if (cha == ';'){ return 38; }
			if (cha == '-'){ return 39; }
			else{ return 40; }
		}
		
	}
	
class ThornStack {
		constructor(withCountCode=true){
			this.first = null;
			this.end = null;
			this.thornstack = [];
			this.list = [];
			this.length = 0;
			this.extra = true;
			this.withCountCode = withCountCode;
		}
		add(tag,object){
			if(tag==null){
				console.log("SUPER PROBLEM");
				console.log(tag);
				console.log(object);
				return;
			}
			var chars = tag.toString().split('');
			var length = chars.length;
			var array = this.thornstack;
			var arrayMissing = true;
			for(var i=0;i<length+1;i++){
				var pos = this.chartonum(chars[i]);
				if(i==length){
					
					
					array.splice(0,0,[0,object]);
					this.length++;
					//EXTRA STUFF
					if(this.withCountCode==true){
						if(this.extra==true){
							if(this.first==null){						
								this.first = object;
								this.end = object;	
							}else{
								this.end.right = object;
								object.left = this.end;
								this.end = object;
							}
							object.checkPosition(this); 
						}
					}else{
						this.list.push(tag);
					}
					break;
				}
				arrayMissing = true;
				for(var j=0;j<array.length;j++){
					if(array[j][0]==pos){
						array = array[j][1];
						arrayMissing = false;
						break;
					}else if(array[j][0]>pos){
						var newArray = [];
						array.splice(j,0,[pos,newArray]);
						array = newArray;
						arrayMissing = false;
						break;
					}
				}
				if(arrayMissing==true){
					var newArray = [];
					array.push([pos,newArray]);
					array = newArray;
				}
				
			}		
		}
	
		getSyn(tag){
			
			
			var chars = tag.split('');
			var length = chars.length;
			
			var array = this.thornstack;
			for(var i=0;i<length+1;i++){
				var pos = this.chartonum(chars[i]);
			
				if(array.length==0){
					return false;
				}
				if(i==length){
					if(array[0][0]==0){
						var last = array[0][1];
						for(var j=0;j<array.length;j++){
							if(array[j][0]==0){
								console.log("LAST");
								last = array[j][1];
								console.log(last);
								
							}
						}
						return last;
						return array[0][1];
					}else{
						return false;
					}
				}
				var isMissing = true;
				for(var j=0;j<array.length;j++){
					if(array[j][0]==pos){
						array = array[j][1];
						isMissing = false;
						break;
					}else if(array[j][0]>pos){
						return false;
					}
				}
				if(isMissing ==true){
					return false;
				}
			}
		}
		get(tag){
			
			
			var chars = tag.split('');
			var length = chars.length;
			
			var array = this.thornstack;
			for(var i=0;i<length+1;i++){
				var pos = this.chartonum(chars[i]);
			
				if(array.length==0){
					return false;
				}
				if(i==length){
					if(array[0][0]==0){
						return array[0][1];
					}else{
						return false;
					}
				}
				var isMissing = true;
				for(var j=0;j<array.length;j++){
					if(array[j][0]==pos){
						array = array[j][1];
						isMissing = false;
						break;
					}else if(array[j][0]>pos){
						return false;
					}
				}
				if(isMissing ==true){
					return false;
				}
			}
		}
		getTest(tag){
			var chars = tag.split('');
			console.log(chars);
			var length = chars.length;
			var array = this.thornstack;
			for(var i=0;i<length+1;i++){
				console.log(chars[i]);
				var pos = this.chartonum(chars[i]);
				if(array.length==0){
					console.log("Here1");
					console.log(array);
					return false;
				}
				if(i==length){
					if(array[0][0]==0){
						console.log("Here2");
						console.log(array);
						return array[0][1];
					}else{
						console.log("Here3");
						console.log(array);
						return false;
					}
				}
				var isMissing = true;
				for(var j=0;j<array.length;j++){
					if(array[j][0]==pos){
						array = array[j][1];
						isMissing = false;
						break;
					}else if(array[j][0]>pos){
						console.log("Here4");
						console.log(array);
						return false;
					}
				}
				if(isMissing ==true){
					return false;
				}
			}
		}
		search(tag){
			var chars = tag.split('');
			var length = chars.length;
			var array = this.thornstack;
			for(var i=0;i<length+1;i++){
				var pos = this.chartonum(chars[i]);
				if(array.length==0){
					return false;
				}
				if(i==length){
					var check = [];
					return this.searchFind(array,check);
				}
				for(var j=0;j<array.length;j++){
					if(array[j][0]==pos){
						array = array[j][1];
						break;
					}else if(array[j][0]>pos){
						return false;
					}
				}
			}
		}
		searchFind(array,check){
			if(check.length==5){
				return check;
			}
			for(var i=0;i<array.length;i++){
				if(array[0][0]==0){
					var notIn = false;
					for(var j=0;j<check.length;j++){
						if(check[j]==array[0][1]){
							//console.log("THE SAME?");
							notIn = true;
						}
					}
					if(notIn==false){
						check.push(array[0][1]);
					}
					if(check.length==5){
						return check;
					}
					//return [array[0][1]];// 
				}else{
					this.searchFind(array[i][1],check);
				}
			}
			return check;
		
		}
		
		chartonum(cha){
			if (cha == 'a' || cha == 'A'){ return 1; }
			if (cha == 'b' || cha == 'B'){ return 2; }
			if (cha == 'c' || cha == 'C'){ return 3; }
			if (cha == 'd' || cha == 'D'){ return 4; }
			if (cha == 'e' || cha == 'E'){ return 5; }
			if (cha == 'f' || cha == 'F'){ return 6; }
			if (cha == 'g' || cha == 'G'){ return 7; }
			if (cha == 'h' || cha == 'H'){ return 8; }
			if (cha == 'i' || cha == 'I'){ return 9; }
			if (cha == 'j' || cha == 'J'){ return 10; }
			if (cha == 'k' || cha == 'K'){ return 11; }
			if (cha == 'l' || cha == 'L'){ return 12; }
			if (cha == 'm' || cha == 'M'){ return 13; }
			if (cha == 'n' || cha == 'N'){ return 14; }
			if (cha == 'o' || cha == 'O'){ return 15; }
			if (cha == 'p' || cha == 'P'){ return 16; }
			if (cha == 'q' || cha == 'Q'){ return 17; }
			if (cha == 'r' || cha == 'R'){ return 18; }
			if (cha == 's' || cha == 'S'){ return 19; }
			if (cha == 't' || cha == 'T'){ return 20; }
			if (cha == 'u' || cha == 'U'){ return 21; }
			if (cha == 'v' || cha == 'V'){ return 22; }
			if (cha == 'w' || cha == 'W'){ return 23; }
			if (cha == 'x' || cha == 'X'){ return 24; }
			if (cha == 'y' || cha == 'Y'){ return 25; }
			if (cha == 'z' || cha == 'Z'){ return 26; }
			if (cha == '0'){ return 27; }
			if (cha == '1'){ return 28; }
			if (cha == '2'){ return 29; }
			if (cha == '3'){ return 30; }
			if (cha == '4'){ return 31; }
			if (cha == '5'){ return 32; }
			if (cha == '6'){ return 33; }
			if (cha == '7'){ return 34; }
			if (cha == '8'){ return 35; }
			if (cha == '9'){ return 36; }
			if (cha == ','){ return 37; }
			if (cha == ';'){ return 38; }
			if (cha == '-'){ return 39; }
			if (cha == ' '){ return 40;}
			else{ return 41; }
		}
		
	}
	
var countER = 6;
var isConnected = false;
var isShared = false;
var isPath = false;
var isArticle = false;
var tableLimit = 10;
var synStack = new ThornStack(withCountCode=false);
synStack.extra = false;
	
if(window.location.href=="http://chemotext.mml.unc.edu/Connected_Terms.html"){
	isConnected = true;
}else if(window.location.href=="http://chemotext.mml.unc.edu/Shared_Terms.html"){
	isShared = true;
}else if(window.location.href=="http://chemotext.mml.unc.edu/Path_Search.html"){
	isPath = true;
}else if(window.location.href=="http://chemotext.mml.unc.edu/Article_Search.html"){
	isArticle = true;
}else{
	console.log(window.location.href);
}
	
function makeSynStack(){
		//console.log("StartSynStack");
		
		readTextFile("http://chemotext.mml.unc.edu/synstack.json",reconstructSynStack,"\r\n");

		//readTextFile("http://chemotext.mml.unc.edu/AllMainTerms.txt",makeSynStack2,"\r\n");
		
		
	}

function reconstructSynStack(jsonObj){
	console.log("Getting Ready to Parse JSON");
	synStack.thornstack = JSON.parse(jsonObj)
	console.log("parsed JSON");
}	
	
function makeSynStack2(allTerms){
		console.log("Start SynStack2");
		//console.log(allTerms[0]);
		for(var i=0;i<allTerms.length;i++){
			var name = allTerms[i];
			var term = name; //new Term(name,"","");
			synStack.add(name,term);
		}
		console.log("Starting Synonyms");
		// open SynonymList.txt  add ALL To Thornstack
			//Set Its isSynonym and mainTerm as well
		readTextFile("http://chemotext.mml.unc.edu/SynonymList.txt",makeSynStack3,"\r\n");
	
	}
function makeSynStack4(newTerms){
	console.log("at synStack4");
	for(var i=0;i<newTerms.length;i++){
			var name = newTerms[i];
			var term = name; //new Term(name,"","");
			synStack.add(name,term);
		}
	readTextFile("http://chemotext.mml.unc.edu/newSubstanceSynList.txt",makeSynStack5,"\r\n");
	
	
}
	
function makeSynStack3(synTerms){
	console.log("at synStack3");
	for(var i=0;i<synTerms.length;i++){
		var name = synTerms[i];
		var split = name.split('\t');
		var check = synStack.get(split[0]);
		if(check!=false){
			var term = split[1]+"|"+split[0];
			synStack.add(split[1],term);
		}
	}
	readTextFile("http://chemotext.mml.unc.edu/substance_list.txt",makeSynStack4,"|\r\n");
	

		
}

function makeSynStack5(synTerms){
	console.log("at synStack5s");
	console.log(synTerms.length);
	for(var i=0;i<synTerms.length;i++){
		var name = synTerms[i];
		var split = name.split('\t');
		var term = split[1]+"|"+split[0];
		synStack.add(split[1],term);
		
	}
	console.log("Here Now");
		var data = JSON.stringify(synStack.thornstack);
	//console.log(byteCount(data));
	console.log("loading array");
	
var url = 'data:text/json;charset=utf8,' + encodeURIComponent(data);
window.open(url, 'synstack.json');
console.log("Some problem");
//window.focus();
	//setCookie("Syn",array,1);
	//console.log("Here");
	//console.log(getCookie("Syn"));
}


function byteCount(s) {
    return encodeURI(s).split(/%..|./).length - 1;
}

function readTextFile(file,success,terminator){
		//console.log("START!");
		var rawFile = new XMLHttpRequest();
		rawFile.open("GET",file,true);
		rawFile.onreadystatechange = function (){
			if(rawFile.readyState == 4){
				if(rawFile.status == 200 || rawFile.status == 0){
					var allText = rawFile.responseText;
					var split = allText.split(terminator);
					success(split);
					//console.log(allText);
				}else{
					//console.log("Failure READING");
				}
			}else{
				//console.log("FailureER");
			}
		}
		rawFile.send(null);
		//console.log("DONE");
	}

	
function simpleSearch(){
		//synStack = new ThornStack();
		//console.log("Synstack is gone");
		isShared = false;
		isPath = false;
		var thepage = document.getElementById("thepage");
		var input = document.getElementById("inputSection");
		var input = document.getElementById("inputbar");
		var tableform = document.getElementById("tableform");
		var downloadform = document.getElementById("downloadform");
		while(downloadform.firstChild){
			downloadform.removeChild(downloadform.firstChild);
		}
		var term = input.value;
		var term1 = synStack.getSyn(term);
		if(term1==false){}
		else
		if(term1.includes('|')){	
			console.log("IS SYNONYM");
			term1 = term1.split('|');
			term = term1[1]; //term1.mainTerm.name;
		}
		console.log("Check 1");
		console.log(term);
		var loader = document.createElement("img");
		loader.src = "ajax-loader.gif";
		loader.alt = "Searching";
		loader.id = "loader";
		thepage.appendChild(loader);
		
		tableform.innerHTML = "Looking for term: " + term ;
		console.log(term);
		
		var checkbox = document.getElementById("mappedCheckbox");
		if(checkbox.checked==true){
			console.log("IsChecked");
			simpleTerm = term;
			var pay = JSON.stringify({
				"statements" : [{
					"statement" : "match (n:Term{name:{name}})-[:MAPPED]->(a) return a " , "parameters" : {"name": term}
				}]
            });
			queryNeo4j(pay,findSimpleSubterms);
			
			
		}else{
			var payload = JSON.stringify({
				"statements" : [{
					"statement" : "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m) return m, a " , "parameters" : {"name": term}
				}]
            });
			queryNeo4j(payload,simpleSearchOnSuccess);	
			console.log("IsNotCheck");
		}
		
		
		
	}
function simpleSearchOnSuccess(data){
	var thepage = document.getElementById("thepage");
		var input = document.getElementById("inputSection");
		var input = document.getElementById("inputbar");
		var tableform = document.getElementById("tableform");
	console.log("Finished Search");
				//tableform.innerHTML = "Processing Results: " + term ;
				//tableform.innerHTML = JSON.stringify(data);
				var results = data["results"][0];
				var data2 = results["data"];
				
			
				
				
				var stack = new ThornStack();
				for (var i=0; i< data2.length ; i++){
					var name = data2[i]["row"][0]["name"];
					var type = data2[i]["row"][0]["type"];
					var stype = data2[i]["row"][0]["stype"];
					var date = data2[i]["row"][1]["date"];
					var pmid = data2[i]["row"][1]["pmid"];
					var title = data2[i]["row"][1]["title"];
					
					
					var check = stack.get(name);

					if(check==false){
						var term = new Term(name,type,stype);
						
						var isDrug = data2[i]["row"][0]["isDrug"];
						if(isDrug=="true"){term.isDrug=true;}
						
						stack.add(name,term);
						term.addArt(pmid,date,stack,title);
					}else{

						
						check.addArt(pmid,date,stack,title);
					}	
				}
				//stack.getTest("Analgesics, Opioid");
				console.log("Done");
				tableform.innerHTML = "";
				
				var loader = document.getElementById("loader");
				thepage.removeChild(loader);

				makeFilters(stack,input.value);
				makeTables(stack,tableLimit);
				makeDownloadableCSV(input.value,stack);
}
var simpleTerm;
var simpleStack;
var subTermMax = 0;
var subTermCount = 0; 
var subTerms = [];
function findSimpleSubterms(data){
	subTerms = [];
	var mappedResults = document.getElementById("mappedResults");
	var button = document.createElement("button");
	mappedResults.appendChild(button);
	button.onclick = showSubterms;
	button.innerHTML = "Click Here to see Subterms";
	var results = data["results"][0];
	var data2 = results["data"];
		simpleStack = new ThornStack();
		
		subTermCount = 0;
		subTermMax = data2.length + 1;
		console.log(subTermMax);
		var payload = JSON.stringify({
				"statements" : [{
					"statement" : "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m) return m, a " , "parameters" : {"name": simpleTerm}
				}]
            });
		queryNeo4j(payload,addSimpleSubtermData);
		
		
		for (var i=0; i< data2.length ; i++){
			var name = data2[i]["row"][0]["name"];	
			subTerms.push(name);
			//mappedResults.innerHTML = mappedResults.innerHTML +  " | " + name;		

			var payload = JSON.stringify({
				"statements" : [{
					"statement" : "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m) return m, a " , "parameters" : {"name": name}
				}]
            });
			queryNeo4j(payload,addSimpleSubtermData);			
		}
		
}

function showSubterms(){
	
						var html = "<html><head><title>" + "Subterms" + "</title></head><body>";
								for(var i= 0;i<subTerms.length;i++){
							
									html = html + "<p>"+subTerms[i]+"</p>";
								}
								html = html + "</body></html>"
								var newpage = window.open("");
								newpage.document.write(html)
	
}


function addSimpleSubtermData(data){
	
	var results = data["results"][0];
	var data2 = results["data"];
		var stack = simpleStack;
				for (var i=0; i< data2.length ; i++){
					var name = data2[i]["row"][0]["name"];
					var type = data2[i]["row"][0]["type"];
					var stype = data2[i]["row"][0]["stype"];
					var date = data2[i]["row"][1]["date"];
					var pmid = data2[i]["row"][1]["pmid"];
					var title = data2[i]["row"][1]["title"];

					
					
					var check = stack.get(name);

					if(check==false){
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
				subTermCount = subTermCount + 1;
				if(subTermCount>subTermMax){
					console.log("GREATER:"+subTermCount);
				}else if(subTermCount==subTermMax){
					var loader = document.getElementById("loader");
				thepage.removeChild(loader);
					console.log(subTermCount);
					var input = document.getElementById("inputbar");
					makeFilters(stack,input.value);
					makeTables(stack,tableLimit);
					makeDownloadableCSV(input.value,stack);
				}else if(subTermCount==subTermMax-1){
					console.log("Got Here");
				}
}

var sharedTerm1;
var sharedTerm2;
function sharedSearch(){
		isShared = true
		isPath = false;
		var thepage = document.getElementById("thepage");
		var input = document.getElementById("inputbar");
		var input2 = document.getElementById("inputbar2");
		var tableform = document.getElementById("tableform");
		var downloadform = document.getElementById("downloadform");
		while(downloadform.firstChild){
			downloadform.removeChild(downloadform.firstChild);
		}
		
		var loader = document.createElement("img");
		loader.src = "ajax-loader.gif";
		loader.alt = "Searching";
		loader.id = "loader";
		thepage.appendChild(loader);
		
		var term = input.value;
		var term1 = synStack.get(term);
		console.log(term1)
		if(term1==false){}
		else
		if(term1.includes('|')){
			term1 = term1.split('|');
			term1 = term1[1]; //term1.mainTerm.name;
		}
		
		var term2 = input2.value;
		var termObj = synStack.get(term2);
		if(termObj==false){}
		else
		if(termObj.includes("|")){
			termObj = termObj.split('|');
			term2 = termObj[1]; //termObj.mainTerm.name;
		}
		
		tableform.innerHTML = "Looking for term: " + term1;
		
		var checkbox = document.getElementById("mappedCheckbox");
		if(checkbox.checked==true){
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
				
				for (var i=0; i< data2.length ; i++){
					var name = data2[i]["row"][0]["name"];
					var type = data2[i]["row"][0]["type"];
					var stype = data2[i]["row"][0]["stype"];
					var date = data2[i]["row"][1]["date"];
					var pmid = data2[i]["row"][1]["pmid"];
					var title = data2[i]["row"][1]["title"];

					var check = stack.get(name);
					
					
					
					if(check==false){
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

					if(check==false){
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
				subTermCount = subTermCount + 1;
				if(subTermCount>subTermMax){
					console.log("GREATER:"+subTermCount);
				}else if(subTermCount==subTermMax){
					var pay = JSON.stringify({
						"statements" : [{
							"statement" : "match (n:Term{name:{name}})-[:MAPPED]->(a) return a " , "parameters" : {"name": sharedTerm2}
						}]
					});
					queryNeo4j(pay,findSharedSubTermsTwo);
				}else if(subTermCount==subTermMax-1){
					console.log("Got Here");
				}
}

function sharedSearchTwo(data){
	var thepage = document.getElementById("thepage");
		var input = document.getElementById("inputbar");
		var input2 = document.getElementById("inputbar2");
		var tableform = document.getElementById("tableform");
		var downloadform = document.getElementById("downloadform");
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
					if(check==false){
					}else{
						var check2 = newstack.get(name);
						if(check2==false){
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
					if(check==false){
					}else{
						var check2 = newstack.get(name);
						if(check2==false){
							check = check.sharedCopy();
							newstack.add(name,check);
							check.addArtShared(pmid,date,newstack,title);
						}else{
							check2.addArtShared(pmid,date,newstack,title);
						}
							
						
						
					}	
				}
				
				console.log("FINISHED SUBTERM or TERM2");
				subTermCount = subTermCount + 1;
				if(subTermCount>subTermMax){
					console.log("GREATER:"+subTermCount);
				}else if(subTermCount==subTermMax){
					stack = newstack;
					console.log(subTermCount);
					var input = document.getElementById("inputbar");
					makeFilters(stack,input.value);
					makeTables(stack,tableLimit);
					makeDownloadableCSV(input.value,stack);
				}else if(subTermCount==subTermMax-1){
					console.log("Got Here");
				}
}

var triangleTerm;
function triangleSearch(){
		isShared = false;
		isPath = true;
		var thepage = document.getElementById("thepage");
		var input = document.getElementById("inputbar");
		var tableform = document.getElementById("tableform");
		var selectBar = document.getElementById("selectBar");
		var downloadform = document.getElementById("downloadform");
		while(downloadform.firstChild){
			downloadform.removeChild(downloadform.firstChild);
		}
		var term = input.value;
		var term1 = synStack.get(term);
		if(term1==false){
			
		}else
		if(term1.includes('|')){
			term1 = term1.split('|');
			term = term1[1]; //term1.mainTerm.name;
		}
		var type = selectBar.value;
		
		var loader = document.createElement("img");
		loader.src = "ajax-loader.gif";
		loader.alt = "Searching";
		loader.id = "loader";
		thepage.appendChild(loader);
		
		tableform.innerHTML = "Looking for term: " + term ;
		console.log(term);
		console.log(type);
		
		
		var checkbox = document.getElementById("mappedCheckbox");
		if(checkbox.checked==true){
			triangleTerm = term;
			var pay = JSON.stringify({
				"statements" : [{
					"statement" : "match (n:Term{name:{name}})-[:MAPPED]->(a) return a " , "parameters" : {"name": term}
				}]
            });
			queryNeo4j(pay,findTriangleSubTerms);
			
		}else{
			var data = "";
			if(type == "Disease" || type == "Other" || type == "Chemical"){
			
				data = JSON.stringify({
				
					"statements" : [{
						"statement" : "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m:Term{type:{type}}) return m, a" , "parameters" : {"name": term, "type":type}
					}]
			
				});
			
			}else{
				data = JSON.stringify({
				
					"statements" : [{
						"statement" : "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m:Term{stype:{type}}) return m, a" , "parameters" : {"name": term, "type":type}
					}]
			
				});
			}
			
			queryNeo4j(data,triangleSearchOnSuccess);
		}
		
	}
	
function triangleSearchOnSuccess(data){
	console.log("Finished Search");
				tableform.innerHTML = "Found " + type ;
				//tableform.innerHTML = JSON.stringify(data);
				var results = data["results"][0];
				//console.log(status);
				//tableform.innerHTML = results;
				var data2 = results["data"];
				var stack = new ThornStack();
				for (var i=0; i< data2.length ; i++){
					var name = data2[i]["row"][0]["name"];
					var type = data2[i]["row"][0]["type"];
					var stype = data2[i]["row"][0]["stype"];
					var date = data2[i]["row"][1]["date"];
					var pmid = data2[i]["row"][1]["pmid"];
										var title = data2[i]["row"][1]["title"];

					var check = stack.get(name);
					
					if(check==false){
						var term = new Term(name,type,stype);
						var isDrug = data2[i]["row"][0]["isDrug"];
						if(isDrug=="true"){term.isDrug=true;}
						stack.add(name,term);
						term.addArt(pmid,date,stack,title);
					}else{
						check.addArt(pmid,date,stack,title);
					}	
				}
				
				
				/*
				
				var term = stack.first;
				for (var i=countER; i> 0 ; i--){
					postRequest(term.name,selectBar.value,newStack,countER,isRunning)
					term = term.right;
				}*/
				var loader = document.getElementById("loader");
				thepage.removeChild(loader);
				var displayText = document.getElementById("displayText");
				displayText.innerHTML = "Choose the B Terms you want to search with";
				makeTables(stack,tableLimit,0);
				
				
				downloadform.innerHTML = "Choose the type of C Terms you want to search for"
				makeSTypes(downloadform,"triType");
				var selectBar2 = document.getElementById("triType");
				
				var newStack = new ThornStack();
				var isRunning = true;
				var button = document.createElement("button");
				button.innerHTML = "Finish Search";
				button.onclick = function(){
					
					isPath = false;
					var checkedTerms = [];
					var checkedString = "Your B Terms: ";
					var term = stack.first;
					var csvName = "";
					for(var i=0; i <stack.length;i++){
						if(term.isSelected==true){
							checkedTerms.push(term);
							checkedString = checkedString + term.name + ", ";
							csvName = csvName + "_" + term.name;
						}
						if(term.right==null){
							break;
						}
						term = term.right;
					}
					checkedString = checkedString + " Your C Term Type: " + selectBar2.value;
					displayText.innerHTML = checkedString;
					countER = checkedTerms.length;
					console.log(countER);
					for(var j=0;j<checkedTerms.length;j++){
						console.log("Post Request");
						term = checkedTerms[j];
						postRequest(term.name,selectBar2.value,newStack,countER,isRunning,csvName)
					}
					
				}
				downloadform.appendChild(button);
				//Make new  TypeBar and Search Button Here.
}	
	
function addTriangleSubTerms(data){
	var results = data["results"][0];
	var data2 = results["data"];
		var stack = simpleStack;
				for (var i=0; i< data2.length ; i++){
					var name = data2[i]["row"][0]["name"];
					var type = data2[i]["row"][0]["type"];
					var stype = data2[i]["row"][0]["stype"];
					var date = data2[i]["row"][1]["date"];
					var pmid = data2[i]["row"][1]["pmid"];
										var title = data2[i]["row"][1]["title"];

					
					
					var check = stack.get(name);

					if(check==false){
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
				subTermCount = subTermCount + 1;
				if(subTermCount>subTermMax){
					console.log("GREATER:"+subTermCount);
				}else if(subTermCount==subTermMax){
					stack = simpleStack;
				var loader = document.getElementById("loader");
				thepage.removeChild(loader);
				var displayText = document.getElementById("displayText");
				displayText.innerHTML = "Choose the B Terms you want to search with";
				makeTables(stack,tableLimit,0);
				
				
				downloadform.innerHTML = "Choose the type of C Terms you want to search for"
				makeSTypes(downloadform,"triType");
				var selectBar2 = document.getElementById("triType");
				
				var newStack = new ThornStack();
				var isRunning = true;
				var button = document.createElement("button");
				button.innerHTML = "Finish Search";
				button.onclick = function(){
					
					isPath = false;
					var checkedTerms = [];
					var checkedString = "Your B Terms: ";
					var term = stack.first;
					var csvName = "";
					for(var i=0; i <stack.length;i++){
						if(term.isSelected==true){
							checkedTerms.push(term);
							checkedString = checkedString + term.name + ", ";
							csvName = csvName + "_" + term.name;
						}
						if(term.right==null){
							break;
						}
						term = term.right;
					}
					checkedString = checkedString + " Your C Term Type: " + selectBar2.value;
					displayText.innerHTML = checkedString;
					countER = checkedTerms.length;
					console.log(countER);
					for(var j=0;j<checkedTerms.length;j++){
						console.log("Post Request");
						term = checkedTerms[j];
						postRequest(term.name,selectBar2.value,newStack,countER,isRunning,csvName)
					}
					
				}
				downloadform.appendChild(button);					
					
				}else if(subTermCount==subTermMax-1){
					console.log("Got Here");
				}	
}
function findTriangleSubTerms(data){
	subTerms = [];
	var mappedResults = document.getElementById("mappedResults");
	var button = document.createElement("button");
	mappedResults.appendChild(button);
	button.onclick = showSubterms;
	button.innerHTML = "Click Here to see Subterms";
	var results = data["results"][0];
	var data2 = results["data"];
		simpleStack = new ThornStack();
		
		subTermCount = 0;
		subTermMax = data2.length + 1;
		console.log(subTermMax);
		var payload = JSON.stringify({
				"statements" : [{
					"statement" : "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m) return m, a " , "parameters" : {"name": triangleTerm}
				}]
            });
		queryNeo4j(payload,addSimpleSubtermData);
		
		
		for (var i=0; i< data2.length ; i++){
			var name = data2[i]["row"][0]["name"];	
			//mappedResults.innerHTML = mappedResults.innerHTML +  " | " + name;		
			subTerms.push(name);
			var payload = JSON.stringify({
				"statements" : [{
					"statement" : "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m) return m, a " , "parameters" : {"name": name}
				}]
            });
			queryNeo4j(payload,addSimpleSubtermData);			
		}	
}

	
function queryNeo4j(payload,successFunc){
	$.ajax({ //443 works.
            url: "http://chemotext.mml.unc.edu:7474/db/data/transaction/commit",
			
            accepts: "application/json; charset=UTF-8",
			
            dataType:"json",
			contentType:"application/json",
            data: payload,
            type:"POST",
            success:function(data,xhr,status)
            {
				successFunc(data);
			 },
            error:function(xhr,err,msg){
                console.log(xhr);
                console.log(err);
                console.log(msg);
				var loader = document.getElementById("loader");
				thepage.removeChild(loader);
				tableform.innerHTML = "Connection to Neo4j Database rejected";
            }
		});
}
	
	
function postRequest(term,type,stack,count,isRunning,csvName){
		var thepage = document.getElementById("thepage");
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
			//headers: { "X-Stream": "false" },
			
            data: data,
            type:"POST",
            success:function(data,xhr,status)
            {
				console.log("Finished Search");
				//tableform.innerHTML = "Processing Results: " + JSON.stringify(data) ;
				//tableform.innerHTML = JSON.stringify(data);
				var results = data["results"][0];
				//tableform.innerHTML = results;
				var data2 = results["data"];
				for (var i=0; i< data2.length ; i++){
					var name = data2[i]["row"][0]["name"];
					var type = data2[i]["row"][0]["type"];
					var stype = data2[i]["row"][0]["stype"];
					var date = data2[i]["row"][1]["date"];
					var pmid = data2[i]["row"][1]["pmid"];
					var check = stack.get(name);
					
					if(check==false){
						var term = new Term(name,type,stype);
						stack.add(name,term);
						term.addArt(pmid,date,stack);
					}else{
						check.addArt(pmid,date,stack);
					}	
				}
				
				
				countER = countER - 1;
				tableform.innerHTML = "Percent Done: " + (100-(countER*20)); 
				console.log("Count: "+countER);
				if(countER==0){
					isRunning = false;
					console.log("FINISHED");
					console.log(stack.length)

				//var loader = document.getElementById("loader");
				//thepage.removeChild(loader);
		
					
					makeTables(stack,tableLimit);
					makeDownloadableCSV(input.value+"_Path"+csvName,stack);
				}
				
				
			 },
            error:function(xhr,err,msg){
                console.log(xhr);
                console.log(err);
                console.log(msg);
				
            }
		});
	
	
	}

function filterStack(dropbox,stack,name){
		console.log("All Terms");
		console.log(stack.length);
		var dateAfter = document.getElementById("dateAfterInput");
		var dateBefore = document.getElementById("dateBeforeInput");
		var newStack = new ThornStack();
		console.log("Stack Length:"+ stack.length);
		if(!isArticle){
			var type = dropbox.value;
			if(type=="None"){
				console.log("Check -1");
				newStack = stack;
			}else if(type == "Disease" || type == "Chemical" || type == "Other"){
				console.log("Check -2");
				name = name+"_"+type;
				var term = stack.first;
				while(true){
					if(term.type == type){
						newStack.add(term.name,term.copy());
					}
					if(term.right!=null){
						term = term.right;
					}else{
						break;
					}
				}
			}else if(type=="Drug"){
				name = name+"_"+type;
				var term = stack.first;
				while(true){
					if(term.isDrug==true){
						newStack.add(term.name,term.copy());
					}
					if(term.right!=null){
						term = term.right;
					}else{
						break;
					}
				}
				
			}else{
				console.log("Check -3");
				name = name+"_"+type;
				var term = stack.first;
				while(true){
					if(term.stype == type){
						newStack.add(term.name,term.copy());
					
					}
					if(term.right!=null){
						term = term.right;
					}else{
						break;
					}
				}
			
			}
		}else{
			newStack = stack;
		}

		//OK
		console.log("Check 1");
		var newnewStack = new ThornStack();
		if(dateAfter.value==""){
			console.log("Check 2");
			newnewStack = newStack;
		}else{
			console.log("Check 3");
			name = name + "_After" + dateAfter.value;
			console.log(dateAfter.value);
			var split = dateAfter.value.split("-");
			var month = parseInt(split[1]);
			var day = parseInt(split[2]);
			var year = parseInt(split[0]);
			//console.log("Check 4");
			var term = newStack.first;
			while(true){
				//break;
				//console.log("Check 5");
				var termCopy = term.copy();
				for(var i =0;i<term.stack.length;i++){	
					if(term.stack[i]==null){
						console.log(term.stack);
					}
					
					if(term.stack[i].year > year){
					
					}else if(term.stack[i].year == year){
						if(term.stack[i].month > month){
						
						}else if(term.stack[i].month == month){
							if(term.stack[i].day >= day){
								
							}else{
								termCopy.count--;
								termCopy.stack[i] = null;
							
							}
						}else{
							termCopy.count--;
							termCopy.stack[i] = null;
						}
					}else{
						termCopy.count--;
						termCopy.stack[i] = null;
					}
				
				}
			
				if(termCopy.count > 0){
					//console.log("Do we even Exist");
					newnewStack.add(term.name,termCopy);
				
				}
				var newArray = [];
				for(var j=0;j<termCopy.stack.length;j++){
					if(termCopy.stack[j]!=null){
						newArray.push(termCopy.stack[j]);
					}
				}
				termCopy.stack = newArray;
				
				if(term.right!=null){
					term = term.right;
				}else{
					break;
				}
			}
			
			
			if(isShared==true){
				filterDateAfterShared(newnewStack,year,month,day);
			}
		}
		
		console.log("Check 6");
		var new3Stack = new ThornStack();
		if(dateBefore.value==""){
			new3Stack = newnewStack;
			console.log("Check 7");
		}else{
			console.log("Check 8");
			name = name + "_Before" + dateBefore.value;
			var term = newnewStack.first;
			var split = dateBefore.value.split("-");
			var month = parseInt(split[1]);
			var day = parseInt(split[2]);
			var year = parseInt(split[0]);
			console.log(year);
			while(true){
				var termCopy = term.copy();
				for(var i =0;i<term.stack.length;i++){
					
					if(term.stack[i] == null){
					
					}else if(term.stack[i].year < year){
						
					}else if(term.stack[i].year == year){
						if(term.stack[i].month < month){
						
						}else if(term.stack[i].month == month){
							if(term.stack[i].day <= day){
								if(term.stack[i].pmid=="26147141"){
									console.log("Yar har har");
									console.log(term.stack[i].year);
								}
							}else{
								//console.log("Flourbags");
								termCopy.count--;
								termCopy.stack[i] = null;
							}
						}else{
							//console.log("Plumbags");
							termCopy.count--;
							termCopy.stack[i] = null;
						}
					}else{
						//console.log("Moneybags");
						termCopy.count--;
						termCopy.stack[i] = null;
					}
				
				}
			
				if(termCopy.count > 0){
					new3Stack.add(term.name,termCopy);
				
				}
				var newArray = [];
				for(var j=0;j<termCopy.stack.length;j++){
					if(termCopy.stack[j]!=null){
						newArray.push(termCopy.stack[j]);
					}
				}
				termCopy.stack = newArray;
					
				if(term.right!=null){
					term = term.right;
				}else{
					break;
				}
			}
			if(isShared==true){
				filterDateBeforeShared(new3Stack,year,month,day);
			}
		}
		console.log("Check Final");
		makeTables(new3Stack,10);
		console.log("Check Final 2");
		if(!isArticle){
			makeDownloadableCSV(name,new3Stack);
		}
		console.log("Check Final 3");
	
	}
	
function filterDateAfterShared(stack,year,month,day){
			var term = stack.first;
			while(true){
				for(var i =0;i<term.stack1.length;i++){
					if(term.stack1[i].year > year){
					
					}else if(term.stack1[i].year == year){
						if(term.stack1[i].month > month){
						
						}else if(term.stack1[i].month == month){
							if(term.stack1[i].day >= day){
								
							}else{
								term.sharedCount1--;
							
							}
						}else{
							term.sharedCount1--;
						}
					}else{
						term.sharedCount1--;
					}
				
				}
				if(term.right!=null){
					term = term.right;
				}else{
					break;
				}
			}
			var term = stack.first;
			while(true){
				for(var i =0;i<term.stack2.length;i++){
					if(term.stack2[i].year > year){
					
					}else if(term.stack2[i].year == year){
						if(term.stack2[i].month > month){
						
						}else if(term.stack2[i].month == month){
							if(term.stack2[i].day >= day){
								
							}else{
								term.sharedCount2--;
							
							}
						}else{
							term.sharedCount2--;
						}
					}else{
						term.sharedCount2--;
					}
				
				}
				if(term.right!=null){
					term = term.right;
				}else{
					break;
				}
			}
	}
	
	
function filterDateBeforeShared(stack,year,month,day){
			var term = stack.first;
			while(true){
				for(var i =0;i<term.stack1.length;i++){
					if(term.stack1[i].year < year){
					
					}else if(term.stack1[i].year == year){
						if(term.stack1[i].month < month){
						
						}else if(term.stack1[i].month == month){
							if(term.stack1[i].day <= day){
								
							}else{
								term.sharedCount1--;
							
							}
						}else{
							term.sharedCount1--;
						}
					}else{
						term.sharedCount1--;
					}
				
				}
				if(term.right!=null){
					term = term.right;
				}else{
					break;
				}
			}
			var term = stack.first;
			while(true){
				for(var i =0;i<term.stack2.length;i++){
					if(term.stack2[i].year < year){
					
					}else if(term.stack2[i].year == year){
						if(term.stack2[i].month < month){
						
						}else if(term.stack2[i].month == month){
							if(term.stack2[i].day <= day){
								
							}else{
								term.sharedCount2--;
							
							}
						}else{
							term.sharedCount2--;
						}
					}else{
						term.sharedCount2--;
					}
				
				}
				if(term.right!=null){
					term = term.right;
				}else{
					break;
				}
			}
	}
	
	
function makeDownloadableCSV(name,stack){
		var downloadform = document.getElementById("downloadform");
		while(downloadform.firstChild){
			downloadform.removeChild(downloadform.firstChild);
		}
	
				var download = document.createElement("button");
				download.type = "button";
				download.id = "download";
				download.style.width = 150;
				download.innerHTML = "View CSV";
				function errorHandler(e) {
					console.log(e);
				}
				function onInitFs(fs){
					console.log('Opened File System:' + fs.name);
					fs.root.getFile(name+"_chemotext.csv",{create:true}, function(fileEntry){
					
						fileEntry.createWriter(function(fileWriter){
							var split = name.split("_");
							var data = "";
							if(isShared==true){
								data = "Term \t Both \t" + split[0] + "\t" + split[1] + "\n";
							}
							var node = stack.first;
							for(var j=0;j<stack.length;j++){
								var arts = "";
										
								data = data + node.name+";"+node.count;
								if(isShared==true){
									data = data + "\t" + node.sharedCount1 + "\t" + node.sharedCount2; 
								}
								data = data + "\n";
								if(node.right==null){
								
									break;
								}
								node = node.right;
							}
							
							fileWriter.addEventListener("writeend", function() {
								window.open("filesystem:http://chemotext.mml.unc.edu/temporary/"+name+"_chemotext.csv");
							}, false);
							var blob = new Blob([data],{type: 'text/plain'});
							fileWriter.write(blob);
							console.log("WRITTEN");
						},errorHandler);
					},errorHandler);
				}
				download.onclick = function(){
				
					window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
					window.requestFileSystem(window.TEMPORARY, 5*1024*1024, onInitFs, errorHandler);
					
				}
				downloadform.appendChild(download);
				
				var section2 = document.createElement("p");
				var download2 = document.createElement("button");
				download2.type = "button";
				download2.id = "download";
				download2.style.width = 150;
				download2.innerHTML = "CSV with pmids";
				function onInitFs2(fs){
					console.log('Opened File System:' + fs.name);
					fs.root.getFile(name+"_pmids_chemotext.csv",{create:true}, function(fileEntry){
					
						fileEntry.createWriter(function(fileWriter){
							
							data = "";
							var node = stack.first;
							for(var j=0;j<stack.length;j++){
								var arts = "";
								for(var k=0;k<node.stack.length;k++){
									arts = arts+"\t"+node.stack[k].pmid;
								}		
								data = data + node.name+";"+node.count+arts+"\n";
								
								if(node.right==null){
									break;
								}
								node = node.right;
							}
							
							fileWriter.addEventListener("writeend", function() {
								// navigate to file, will download
							//location.href = fileEntry.toURL();
								window.open("filesystem:http://chemotext.mml.unc.edu/temporary/"+name+"_pmids_chemotext.csv");
							}, false);
							var blob = new Blob([data],{type: 'text/plain'});
							fileWriter.write(blob);
							//var blob = new Blob(["Hoi"],{type: 'text/plain'});
							//fileWriter.write(blob);
							console.log("WRITTEN");
						},errorHandler);
					},errorHandler);
				}
				
				download2.onclick = function(){
					
					window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
					window.requestFileSystem(window.TEMPORARY, 5*1024*1024, onInitFs2, errorHandler)
					
					
				}
				section2.appendChild(download2);
				downloadform.appendChild(section2);

	
	}

	
function makeFilters(stack,name){
	
	
		var filterSection = document.getElementById("filterSection");
		while(filterSection.firstChild){
			filterSection.removeChild(filterSection.firstChild);
		}
			var select = "";
			
			makeSTypes(filterSection,"typeSelect",true);
			
			select = document.getElementById("typeSelect");
			
				var filterType = document.createElement("button");
				filterType.type = "submit";
				filterType.id = "download";
				filterType.innerHTML = "Filter";
				filterType.style.height = select.style.height;
				filterType.onclick = function(){ filterStack(select,stack,name); }
				filterSection.appendChild(filterType);
			
				
				//END OF TYPE FILTER
				var dateAfter = document.createElement("p");
				dateAfter.innerHTML = "Date After:";
				var dateAfterInput = document.createElement("input");
				dateAfterInput.id = "dateAfterInput";
				dateAfterInput.type = "date";
				dateAfterInput.style.marginLeft = 11;
				dateAfterInput.style.marginRight = 10;
				
				dateAfter.appendChild(dateAfterInput);
				filterSection.appendChild(dateAfter);
				
				dateAfter.innerHTML = dateAfter.innerHTML + " Date Before:";
				//dateAfter.appendChild(" Date Before:")
				var dateBefore = document.createElement("p");
				dateBefore.innerHTML = "Date Before:";
				var dateBeforeInput = document.createElement("input");
				dateBeforeInput.id = "dateBeforeInput";
				dateBeforeInput.type = "date";
				dateBeforeInput.style.marginLeft = 11;
				
				
				dateAfter.appendChild(dateBeforeInput);
				//filterSection.appendChild(dateBefore);
	
	
	}
function makeTables(stack,limit,index=0){
		
		var tableform = document.getElementById("tableform");
		while(tableform.firstChild){
			tableform.removeChild(tableform.firstChild);
		}
		
		
		if(stack.length==0){
			tableform.innerHTML = "No Results";
			console.log("Table Empty");
			return;
		}
		var maintable = document.createElement("Table");
		var rowheading = document.createElement("TR");
		if(isPath){
			var headcol3 = document.createElement("TD");
			headcol3.className = "countCol";
			rowheading.appendChild(headcol3);

		}
		if(isArticle){
			var headcol1 = document.createElement("TD");
			headcol1.innerHTML = "Articles";
			headcol1.style.textAlign = "center";
			rowheading.appendChild(headcol1);

		}else{
			var headcol1 = document.createElement("TD");
			var headcol2 = document.createElement("TD");
			headcol1.innerHTML = "Terms";
			headcol2.innerHTML = "Count";
			headcol2.style.textAlign = "center";
			headcol2.className = "countCol";
			rowheading.appendChild(headcol1);
			rowheading.appendChild(headcol2);
		}

		if(isShared){
			var headcol3 = document.createElement("TD");
			var headcol4 = document.createElement("TD");
			headcol3.className = "countCol";
			headcol4.className = "countCol";
			var inputbar = document.getElementById("inputbar");
			var inputbar2 = document.getElementById("inputbar2");
			headcol2.innerHTML = "Same Article";
			headcol3.innerHTML = inputbar.value + " Only";
			headcol4.innerHTML = inputbar2.value + " Only";
			rowheading.appendChild(headcol3);
			rowheading.appendChild(headcol4);
		}
		
		maintable.appendChild(rowheading);
		
		
		var indexLimit = index+limit;
		if(indexLimit>stack.length){
			indexLimit = stack.length;
		}
		
		var newchemicalarray = [];
		if(!isArticle){
			var node = stack.first;
			for(var i=0;i<index;i++){
				node = node.right;
			}
			for(var j=index;j<indexLimit;j++){
				
				if(isShared){
					newchemicalarray.push([node.name,node.count,node,node.sharedCount1,node.sharedCount2]);
				}else if(isPath){
					newchemicalarray.push([node.name,node.count,node,node.isSelected,node]);
				}else{
					newchemicalarray.push([node.name,node.count,node]);
				}
				if(node.right==null){
					break;
				}
				node = node.right;
			}
		}else{
			for(var j=index;j<indexLimit;j++){
				//console.log(stack.list[j]);
				newchemicalarray.push(stack.list[j]);
			}
		}
		
		for(x in newchemicalarray){
			xx = newchemicalarray[x];
			var newrow = document.createElement("TR");
			var col1 = document.createElement("TD");
			
			if(isPath){
				var col6 = document.createElement("TD");
				var checkbox = document.createElement("INPUT");
				checkbox.setAttribute("type","checkbox");
				col6.className = "countCol";
				col6.appendChild(checkbox);
				
				newrow.appendChild(col6);
				if(xx[3]==true){
					checkbox.checked = true;
				}
				checkbox.name = xx[0];
				$(checkbox).click(function(){
					
					var term = stack.get(this.name);
					term.isSelected = this.checked;
				});
			}
			
			if(!isArticle){
				var col2 = document.createElement("TD");
				col2.className = "countCol";
				col1.innerHTML = xx[0];
				col2.innerHTML = xx[1];
				if(!isPath){
					var button = document.createElement("button");
					button.innerHTML = xx[1];
					button.type = "button";
					button.className = "articleButton";
					col2.innerHTML = "";
					col2.appendChild(button);
					button.onclick = (function(x){
					return function(){
						var limit = 20;
						yy = newchemicalarray[x];
						var node = yy[2];
						var pmids = "Pmids=";
						for(var i= 0;i<node.stack.length;i++){
							pmids = pmids + node.stack[i].pmid + "|";
						}
						var html = "<html><head><title>" + node.name + "</title></head><body>";
								for(var i= 0;i<node.stack.length;i++){
									if(node.stack[i]==null){
									}else{
										var displayText = node.stack[i].pmid;
										if(node.stack[i].title!=null){
											displayText = node.stack[i].title;
										}
										html = html + "<p><a href=http://www.ncbi.nlm.nih.gov/pubmed/"+node.stack[i].pmid+">"+displayText+"</a></p>";

										

									}
								}
								html = html + "</body></html>"
								var newpage = window.open("");
								newpage.document.write(html)
	

					};
					})(x);
				}
				
		
				newrow.appendChild(col1);
				newrow.appendChild(col2);
			}
			if(isArticle){
				//console.log(xx);
				var link = document.createElement("a");
				link.href = "http://www.ncbi.nlm.nih.gov/pubmed/"+xx;
				
				link.innerHTML = xx;
				link.style.textAlign = "center";
				col1.style.textAlign = "center";
				col1.appendChild(link);
				newrow.appendChild(col1);
			}
			if(isShared){
				var col4 = document.createElement("TD");
				var col5 = document.createElement("TD");
				col4.innerHTML = " "+xx[3]+" ";
				col5.innerHTML = " "+xx[4]+" ";
				col4.className = "countCol";
				col5.className = "countCol";
				newrow.appendChild(col4);
				newrow.appendChild(col5);
			}
			
			//table1.appendChild(newrow);
			maintable.appendChild(newrow);
		} 
		
		maintable.className = "center";
		//maincol1.appendChild(table1);		
		
		//mainrow.appendChild(maincol1);
		//mainrow.appendChild(maincol3);
		
		//maintable.appendChild(mainrow);
		//maintable.style.textAlign = "center";
		//maintable.style.paddingLeft = "540px";
		//maintable.style.marginLeft = "35%";
		//maintable.style.marginRight = "35%";
		//maintable.style.width = "40%";
		
		//tableform.style.textAlign = "center";
		//tableform.paddingLeft = "30px";
		
		tableform.appendChild(maintable);
		addTableNext(stack,limit,index,tableform,maintable);
		
		var p = document.createElement("p");
		p.innerHTML = "Total Count: " + stack.length;
		tableform.appendChild(p);
		
		
	}
function addTableNext(stack,limit,index,tableform,table){
		

			var diagram = document.createElement("img");
			diagram.src = "previous.png";
			diagram.style.width = 20;
			diagram.style.height = 20;
			diagram.style.marginRight = 20;
			diagram.onclick = function(){makeTables(stack,limit,index-limit);}
			tableform.appendChild(diagram);
			addTableLimit(stack,tableform);

			var diagram2 = document.createElement("img");
			diagram2.src = "next.png";
			diagram2.style.width = 20;
			diagram2.style.height = 20;
			diagram2.style.marginLeft = 20;
			diagram2.onclick = function(){makeTables(stack,limit,index+limit);}
			tableform.appendChild(diagram2);
	
	
	
		if(index<=0){
			diagram.style.visibility = "hidden";

		}else if(index>=stack.length){
			diagram2.style.visibility = "hidden";
		
		}

	
	}
function addTableLimit(stack,tableform){
		var limitInput = document.createElement("input");
		limitInput.value = tableLimit;
		tableform.appendChild(limitInput);
		var limitButton = document.createElement("button");
		tableform.appendChild(limitButton);
		limitButton.innerHTML = "Set Table Limit";
		limitButton.type = "submit";
		limitButton.onclick = function(){
			tableLimit = parseInt(limitInput.value);
			makeTables(stack,parseInt(limitInput.value),0)
		}
	
	}
function inputSuggestion(id,inputSection){
		var inputBar = document.createElement("input");
		inputBar.id = id;
		inputBar.style.width = 500;
		
		var newDataList = document.createElement("datalist");
		newDataList.id = "newDL"+id;
		
	
		
		inputSection.appendChild(newDataList);
		inputBar.setAttribute('list','newDL'+id);
		
		inputSection.appendChild(inputBar);

		$(inputBar).keyup(function(keyEvent){
			var input = $(this).val();
			var check = synStack.search(input);
			
			
			var keyC = keyEvent.keyCode;
			//console.log(keyC);
			if(check!=false && check!=[] && keyC!=37 && keyC!=38 && keyC!=39 && keyC!=40){
				//console.log(check);
				//console.log(check.length);
				newDataList.innerHTML = "";
				for(var i=0;i<check.length;i++){
					var option = document.createElement("option");
					if (check[i].includes("|")){
						check[i] = check[i].split('|')[0];
					}
					option.value = check[i];
					newDataList.appendChild(option);	
				}
			}else{
				//console.log(check);
			}
		});
	}

function makeSTypes(parent,id,withNone=false){
				var select = document.createElement("select");
				select.id = id;
				select.style.margin = 0;
				select.style.padding = 2;
				if(withNone==true){
					var option4 = document.createElement("option");
					option4.innerHTML = "No Filter";
					option4.value = "None";
					select.appendChild(option4);
				}
				
				
				var stypes = ["Disease","Bacteria",
					"Viruses",
					"Bacterial Infections and Mycoses",
					"Neoplasms",
					"Nervous System Diseases",
					"Eye Diseases",
					"Male Urogenital Diseases",
					"Female Urogentital Diseases and Pregnancy Complications",
					"Hemic and Lymphatic Diseases",
					"Congenital, Hereditary, and Neonatal Diseases and Abnormalities",
					"Skin and Connective Tissue Diseases",
					"Nutritional and Metabolic Diseases",
					"Endocrine System Diseases",
					"Immune System Diseases",
					"Pathological Conditions, Signs and Symptoms",
					"Wounds and Injuries", "Chemical",  "Drug",
					"Inorganic Chemicals",
					"Organic Chemicals",
					"Heterocyclic Compounds",
					"Polycyclic Compounds",
					"Macromolecular Substances",
					"Complex Mixtures",
					"Biomedical and Dental Materials",
					"Pharmaceutical Preparations",
					"Chemical Actions and uses",
					"Other",
					"Hormones, Hormone Substitutes, and Hormone Antagonists",
					"Enzymes and Coenzymes",
					"Carbohydrates",
					"Lipids",
					"Amino Acids, Peptides, and Proteins",
					"Nucleic Acids, Nucleotides, and Nucleosides",
					"Biological Factors"
					];
				
				
				for(var i =0; i<stypes.length;i++){
					var option= document.createElement("option");
					option.value = stypes[i];
					if(stypes[i]== "Disease"){
						option.innerHTML = "Diseases and Indications";
						option.style.fontWeight = 'bold';
					}else if(stypes[i] == "Other"){
						option.innerHTML = "Proteins-Pathways-Intermediaries-Other";
						option.style.fontWeight = 'bold';
					}else if(stypes[i]=="Chemical"){
						option.innerHTML = "Chemicals";
						option.style.fontWeight = 'bold';
					}else if(stypes[i]=="Drug"){
						option.innerHTML = '- - ' + stypes[i];
						option.style.fontWeight = 'bold';
					}else{
						option.innerHTML = '- - ' + stypes[i];
					}
					select.appendChild(option);
				}
				
				parent.appendChild(select);
	
	
	}
	
function createMappedSection(){
	
	var mappedSection = document.getElementById("mappedSection");
	
	var x = document.createElement("INPUT");
	x.setAttribute("type", "checkbox");
	x.id = "mappedCheckbox";
	
	mappedSection.appendChild(x);
	
	mappedSection.innerHTML = mappedSection.innerHTML + " Click to Include Subterms";
	
	var results = document.createElement("p");
	results.id = "mappedResults";
	mappedSection.appendChild(results);
	
}	
	
function makePageSections(){
		var thepage = document.getElementById("thepage");
		while(thepage.firstChild){
			thepage.removeChild(thepage.firstChild);
		}
		thepage.addEventListener('submit', function(e) {
			console.log("Page Event Listerner");
			e.preventDefault();
		}, false);
		
		var introSection = document.createElement("p");
		introSection.id = "introSection";
		
		
		var inputSection = document.createElement("form");
		inputSection.autocomplete = "off";
		inputSection.id = "inputSection";
		
		var mappedSection = document.createElement("p");
		mappedSection.id = "mappedSection";
		
		
		var tableSection = document.createElement("form");
		tableSection.id = "tableform";
		tableSection.class = "center";
		var downloadSection = document.createElement("p");
		downloadSection.id = "downloadform";
		downloadSection.style.textAlign = "center";
		var filterSection = document.createElement("form");
		filterSection.id = "filterSection";
		thepage.appendChild(introSection);
		thepage.appendChild(inputSection);
		thepage.appendChild(mappedSection);
		thepage.appendChild(tableSection);
		thepage.appendChild(downloadSection);
		thepage.appendChild(filterSection);
		
		var table = document.createElement("Table");
		var row = document.createElement("TR");
		var col1 = document.createElement("TD");
		col1.id = "introText";
		var col2 = document.createElement("TD");
		col2.id = "introGraphic";
		row.appendChild(col1);
		row.appendChild(col2);
		table.appendChild(row);
		introSection.appendChild(table);
	
	
		thepage.style.paddingTop = "15px";
		introSection.style.paddingTop = "15px";
		inputSection.style.paddingTop = "15px";
		tableSection.style.paddingTop = "15px";
		downloadSection.style.paddingTop = "15px";
		filterSection.style.paddingTop = "15px";
	}
function showConnectedTerms(){

		makePageSections();
		createMappedSection();
		var col1 = document.getElementById("introText");
		var col2 = document.getElementById("introGraphic");
		col1.innerHTML = 
		"This search gives you all terms that co-exist in an article with the term that you enter." + 
		" The count represents the number of articles where they co-occur " +
  
        "";

		var diagram = document.createElement("img");
		diagram.src = "Single_Search_Image.png";
		diagram.width = 230 * 1.3;
		diagram.height = 150 * 1.3;
		col2.appendChild(diagram);
		
		
		var inputSection = document.getElementById("inputSection");	
		inputSuggestion("inputbar",inputSection);
		
		var searchbutton = document.createElement("button");
		searchbutton.type = "submit";
		searchbutton.innerHTML = "Search";
		searchbutton.onclick = function(){
				simpleSearch()
		}
		inputSection.appendChild(searchbutton);
		
		

		
	}
function showSharedTerms(){
	
		makePageSections();
		createMappedSection();
		var col1 = document.getElementById("introText");
		var col2 = document.getElementById("introGraphic");
		col1.innerHTML = 
		" This search inputs two terms and gives you three results -- all terms that co-exist with either term" +
" or both terms in an article. The counts respresent the number of articles where they co-occur or articles that they are present in" ;

		var diagram = document.createElement("img");
		diagram.src = "Shared_Terms_Image.png";
		diagram.width = 210 * 1.3;
		diagram.height = 140 * 1.3;
		col2.appendChild(diagram);
		
		
		var inputSection = document.getElementById("inputSection");	
		inputSuggestion("inputbar",inputSection);
		
		
		
		var inputform = document.createElement("p");
		
		inputform.style.paddingTop = "15px";
		inputSection.appendChild(inputform);

		inputSuggestion("inputbar2",inputform);
		
		
		var searchbutton = document.createElement("button");
		searchbutton.innerHTML = "Search";
		searchbutton.type = "submit";
		searchbutton.onclick = function(){
			console.log("and goodbye");
			sharedSearch()
		}
		inputSection.appendChild(searchbutton);
		
		
	}
function showSwanson(){	
		makePageSections();
		createMappedSection();
		var col1 = document.getElementById("introText");
		var col2 = document.getElementById("introGraphic");
		col1.innerHTML = 
		"  In this search you input an A term and the type of B term you wish to search for. Chemotext " +
" will then display a list of the B terms through the same method as Connected Terms search. You then choose which B terms you wish do continue mediating the search through and the " +
" the type of C term you wish to search for. Chemotext will then process this request and display the list of C terms. This path search allows you to look for"+
" new relationships between A and C terms through a mediating B term. ";

		var diagram = document.createElement("img");
		diagram.src = "Path_Search_Image.png";
		diagram.width = 150 *1.5;
		diagram.height = 130 * 1.5;
		col2.appendChild(diagram);
		
		
		
		
		
		
		var inputSection = document.getElementById("inputSection");	
		inputSuggestion("inputbar",inputSection);
		
		var searchbuttonform = document.createElement("p");
		var selectform = document.createElement("p");
		selectform.innerHTML = "Choose the Type of B Terms to search for"
		
		selectform.style.paddingTop = "15px";
		inputSection.appendChild(selectform);
		makeSTypes(selectform,"selectBar");
		
		var searchbutton = document.createElement("button");
		searchbutton.innerHTML = "Search";
		searchbutton.type = "submit";
		searchbutton.onclick = function(){

			triangleSearch();
			console.log("TRIANGLESEARCH AGAIN");
		
		}
		searchbuttonform.appendChild(searchbutton);
		inputSection.appendChild(searchbuttonform);
		
		var displayText = document.createElement("p");
		displayText.id = "displayText";
		inputSection.appendChild(displayText);
	
	}
function showHowItWorks(){
		var mainbutton1 = document.getElementById("mainbutton1");
		var mainbutton2 = document.getElementById("mainbutton2");
		var mainbutton3 = document.getElementById("mainbutton3");
		mainbutton1.className = "active";
		mainbutton2.className = "";
		mainbutton3.className = "";
	
		
		

	}
function showArticleSearch(){
	console.log("Show Article Search");
	makePageSections();
	
	var col1 = document.getElementById("introText");
		var col2 = document.getElementById("introGraphic");
		col1.innerHTML = 
		" Enter one or multiple terms and Chemotext will return all the articles that co-occur with your input terms.";

		var diagram = document.createElement("img");
		diagram.src = "articlePicture.png";
		diagram.width = 150 *1.5;
		diagram.height = 110 * 1.5;
		col2.appendChild(diagram);
	
	
	
	var inputSection = document.getElementById("inputSection");	
	inputSuggestion("articleBar",inputSection);
		
	var addTermButton = document.createElement("button");	
	addTermButton.type = "submit";	
	addTermButton.innerHTML = "Add Term";
	
	inputSection.appendChild(addTermButton);	
		
	var introSection = document.getElementById("introSection");
	var displayText = document.createElement("p");
		displayText.id = "displayText";
		introSection.appendChild(displayText);	
	displayText.style.marginTop = 50;	
	displayText.innerHTML = " ";
		
	var searchbutton = document.createElement("button");
	searchbutton.type = "button";
	searchbutton.innerHTML = "Search";
	searchbutton.onclick = function(){
		articleSearch()
	}
	searchbutton.style.visibility = "hidden";
	addTermButton.onclick = function(){
		var input = document.getElementById("articleBar");
		if(input.value==""){
			articleSearch();
		}else{
			searchbutton.style.visibility = "visible";
			addToArticleArray()
		}
	}
	
	inputSection.appendChild(searchbutton);
}

var artArray = [];
function addToArticleArray(){
	
	var tableform = document.getElementById("tableform");
		while(tableform.firstChild){
			tableform.removeChild(tableform.firstChild);
		}
	
	
	var articleBar = document.getElementById("articleBar");
	var displayText = document.getElementById("displayText");
	var check = synStack.get(articleBar.value);
	if(check!=false){
		if(check.includes("|")){
			check = check.split("|")[1];
		}
		artArray.push(check);
		//console.log(artArray);
		var title = " ";
		displayText.innerHTML = title;
		for(var i=0;i<artArray.length;i++){
			var x = artArray[i];
			var p = document.createElement("p");
			var b = document.createElement("button");
			b.type = "button";
			b.innerHTML = "X";
			b.onclick = (function(x){
				return function(){
					deleteFromArticleArray(x);
				};
			})(x);
			
			
			displayText.innerHTML = displayText.innerHTML + " " + artArray[i] + " ";
			displayText.appendChild(b);
		}
		//displayText.innerHTML = title
	}
	articleBar.value = "";
	// id= articleBar. check to see if Term exists and if it does add to array in memory and list on computer.
}
function articleSearch(){
	
	var input = document.getElementById("articleBar");
		if(input.value==""){
			
		}else{
		
			addToArticleArray();
		}
	
	
	
	var tableform = document.getElementById("tableform");
	var matchStr = "match (n:Term {name:{name0}})-[]-(a)";
	var params = { "name0" : artArray[0] };
	for(var i =1;i<artArray.length;i++){
		var name = "name"+i;
		params[name] = artArray[i];
		matchStr = matchStr + " match (n"+artArray[i]+":Term {name:{"+name+"}})-[:MENTIONS]-(a)";
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
				thepage.removeChild(loader);
				tableform.innerHTML = "Connection to Neo4j Database rejected";
            }
		});
}

function deleteFromArticleArray(term){
	
	var tableform = document.getElementById("tableform");
		while(tableform.firstChild){
			tableform.removeChild(tableform.firstChild);
		}
	
	console.log("Delete");
	var displayText = document.getElementById("displayText");

	var index = artArray.indexOf(term);
	artArray.splice(index,1);
	
	displayText.innerHTML = " ";
	var title = "";
		for(var i=0;i<artArray.length;i++){
			var x = artArray[i];
			var p = document.createElement("p");
			var b = document.createElement("button");
			b.type = "button";
			b.innerHTML = "X";
			b.onclick = (function(x){
				return function(){
					deleteFromArticleArray(x);
				};
			})(x);
			
			
			displayText.innerHTML = displayText.innerHTML + " " + artArray[i] + " ";
			displayText.appendChild(b);
		}
		
}
	

function goToConnectedTerms(){
		window.location.href = "Connected_Terms.html";
	}
function goToSharedTerms(){
		window.location.href = "Shared_Terms.html";
	}
function goToPathSearch(){
		window.location.href = "Path_Search.html";
		
	}
function goToHome(){
	window.location.href = "index.html";
}
function goToArticleSearch(){
	window.location.href = "Article_Search.html";
}
	
	
if(isConnected==true){
	showConnectedTerms();
	makeSynStack();
}else if(isShared==true){
	showSharedTerms();
	makeSynStack();
}else if(isPath==true){
	showSwanson();
	makeSynStack();
}else if(isArticle==true){
	showArticleSearch();
	makeSynStack();
}else{
	showHowItWorks();
}
	


