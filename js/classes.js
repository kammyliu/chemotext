
class Art{
	constructor(pmid,date,title){
		this.pmid = pmid;
		this.title = title;
		if(date==null){
			this.date = "Unknown";
		}else{
			this.date = date.toString();
			this.year = parseInt(this.date.substring(0,4));
			this.month = parseInt(this.date.substring(4,6));
			this.day = parseInt(this.date.substring(6,8));
		}
	}
	
	// Return title if there is one. Otherwise, return pmid
	getTitleOrId(){
		if (this.title != null){
			return this.title;
		} else {
			return this.pmid;
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
		
		this.articles = [];
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
		
		copy.articles = this.articles.slice()

		return copy;
	}
	
	addArticle(pmid, date, title){
		this.articles.push(new Art(pmid, date, title));
	}
}
	
class NumStack {
	constructor(){
		this.stack = [];
		this.thornstack = [];
	}
	add(tag,object){
		var chars = tag.toString().split('');
		var array = this.thornstack;
		for(var i=0;i<chars.length;i++){
			if (array.length==0){
				for(var j=0;j<11;j++){
					array.push([]);
				}
			}
			var pos = this.chartonum(chars[i]);
			array = array[pos];
		}		
		array[0] = object;
		this.stack.push(object);
	}
	
	get(tag){
		var chars = tag.toString().split('');
		var array = this.thornstack;
		for(var i=0;i<chars.length;i++){
			if(array.length==0){
				return false;
			}
			var pos = this.chartonum(chars[i]);
			array = array[pos];
		}
		if(array[0]==[]){
			return false;
		}else{
			return array[0];
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
		var chars = tag.toString().split('');
		var length = chars.length;
		var array = this.thornstack;
		
		for(var i=0;i<length;i++){
			var arrayMissing = true;
			var pos = this.chartonum(chars[i]);
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
	}
	
	get(tag){
		var chars = tag.split('');
		var array = this.thornstack;
		
		for(var i=0;i<chars.length;i++){		
			if(array.length==0){
				return false;
			}
			var isMissing = true;
			var pos = this.chartonum(chars[i]);
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
		
		if(array[0][0]==0){
			return array[0][1];
		}else{
			return false;
		}
	}
	
	/* Used only to compare the order of characters. Unnecessary */
	chartonum(cha){
		var upper = cha.toUpperCase();
		var code = upper.charCodeAt(0);
		
		// is a letter
		if (code >= 65 && code <= 90){
			return code-64;	//1 - 26
		}
		
		//is a number
		if (code >= 48 && code <= 57){
			return code-21;	//27 - 36
		}
		
		if (cha == ','){ return 37; }
		if (cha == ';'){ return 38; }
		if (cha == '-'){ return 39; }
		if (cha == ' '){ return 40; }

		return 41; 
	}
}

class TermBank {
	
	// takes a sorted (case-insensitive) array of strings, with synonyms demarcated by |. Terms have only 0 or 1 synonyms
	constructor(list){
		this.list = list;
		this.suggestCount = 5;	//the max number of suggestions complete() will return
	}
	
	// return synonym, or self if no synonym
	getSynonym(term){
		var index = this.getIndex(term, true);
		//console.log(index);
		var entry = this.list[index];
		if (entry.includes('|')){
			entry = entry.split('|')[1];
		} 
		return entry; 
	}
	
	// returns an array of autocomplete options, with length up to this.suggestCount
	complete(prefix){		
		var options = [];
		var index = this.getIndex(prefix, false);
		
		if (index > -1){
			for (var i=0; i<this.suggestCount && index<this.list.length && this.isPrefix(prefix, this.list[index]); i++){
				var entry = this.list[index++];
				if (entry.includes('|')){
					entry = entry.split('|')[0];
				} 
				options.push(entry);
			}
		} 
		
		return options;
	}	
	
	// If 'exact', get the index of the first item that is equal to the target (case-insensitive)
	// If not 'exact', it can also just begin with the target
	getIndex(target, exact) {
		target = target.toUpperCase();
		
		//binary search
		var low = 0, high = this.list.length - 1, i, comp;
		while (low <= high) {
			i = Math.floor((low + high) / 2);
			comp = this.list[i].toUpperCase();
	
			if (comp < target){ low = i + 1; continue; }
			if (comp > target) { high = i - 1; continue; }
			return i;
		}

		if (!exact && this.isPrefix(target, this.list[low])){
			return low;
		} 
		
		//split off the term without its synonym
		comp = this.list[low].toUpperCase();
		if (comp.includes('|')){
			comp = comp.split('|')[0];
		}
		if (comp === target){
			return low;
		}
		return -1;
	}
	
	// return whether the first argument is a prefix of the second. Case-insensitive
	isPrefix(prefix, string){
		return string.toUpperCase().substring(0, prefix.length) === prefix.toUpperCase();
	}
}

