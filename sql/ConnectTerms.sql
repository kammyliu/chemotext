CREATE TEMP TABLE termA_mapped (term_idx NUMERIC PRIMARY KEY);

INSERT INTO termA_mapped
SELECT ts.term_idx AS term_idx
FROM term_syn ts
WHERE ts.synonym=:termA

--This expression handles subterm mapping. We'll consider the subterms of termA
-- only if the parameter :include_subterms is set to 1.
INSERT OR IGNORE INTO termA_mapped
SELECT m.obj_idx AS term_idx
FROM term_syn ts 
INNER JOIN mapped m ON m.sub_idx=ts.term_idx
WHERE ts.synonym=:termA
AND :include_subterms=1
       
--Get all the term/publication combinations from those papers which reference termA
-- so the data in this table would be termX,123 termX,124 termY,124 termZ,125
CREATE TEMP TABLE termA_pubs (term_idx NUMERIC, pmid NUMERIC, PRIMARY KEY (term_idx,pmid));

INSERT OR IGNORE INTO termA_pubs
	SELECT m2.term_idx, m2.pmid FROM termA_mapped tA
	INNER JOIN mentions m1 ON tA.term_idx=m1.term_idx 
	INNER JOIN mentions m2 ON m1.pmid=m2.pmid;

-- Return a list of terms which are co-mentioned along side termA
-- and a count of the number of papers which co-mention termA and termB.
-- Exclude the "termA" from the result list (e.g. all papers; as every paper which mention termA will be counted).
SELECT t.name as term_name, COUNT(termA_pubs.pmid) as pub_count
FROM termA_pubs
INNER JOIN term t ON termA_pubs.term_idx=t.term_idx 
WHERE t.name<>:termA
GROUP BY termA_pubs.term_idx
ORDER BY pub_count DESC;
