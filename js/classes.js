
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
				if(this.withCountCode){
					if(this.extra){
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
			if(arrayMissing){
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
			if(isMissing){
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
			if(isMissing){
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
			if(isMissing){
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
				if(!notIn){
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
	