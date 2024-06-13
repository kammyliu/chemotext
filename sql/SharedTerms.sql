CREATE TEMP TABLE termA_terms (term_idx NUMERIC PRIMARY KEY);

CREATE TEMP TABLE termB_terms (term_idx NUMERIC PRIMARY KEY);

CREATE TEMP TABLE valid_terms (term_idx NUMERIC PRIMARY KEY);

INSERT
	INTO
	termA_terms
SELECT
	DISTINCT m2.term_idx AS term_idx
FROM
	term_syn ts
INNER JOIN term t1 ON
	ts.term_idx = t1.term_idx
INNER JOIN mentions m1 ON
	t1.term_idx = m1.term_idx
INNER JOIN mentions m2 ON
	m1.pmid = m2.pmid
WHERE
	ts.synonym =:termA
	AND m2.term_idx <> t1.term_idx;

INSERT
	INTO
	termB_terms
SELECT
	DISTINCT m2.term_idx AS term_idx
FROM
	term_syn ts
INNER JOIN term t1 ON
	ts.term_idx = t1.term_idx
INNER JOIN mentions m1 ON
	t1.term_idx = m1.term_idx
INNER JOIN mentions m2 ON
	m1.pmid = m2.pmid
WHERE
	ts.synonym =:termB
	AND m2.term_idx <> t1.term_idx;
--SELECT COUNT(*) FROM termB_terms LIMIT 1;
--The temp table is a list of "valid terms" which occur in both papers connect to term a and term b.
--This helps massively in our queries as we need to be able to leave the indexing of PRIMARY KEY
--be able to create our further views.
INSERT
	INTO
	valid_terms 
SELECT
	t1.term_idx AS term_idx
FROM
	termA_terms t1
INNER JOIN termB_terms t2 ON
	t2.term_idx = t1.term_idx;

CREATE TEMP TABLE termA_associated_pubs (term_name TEXT,
term_idx NUMERIC,
pmid NUMERIC,
PRIMARY KEY (term_idx,
pmid));

CREATE TEMP TABLE termB_associated_pubs (term_name TEXT,
term_idx NUMERIC,
pmid NUMERIC,
PRIMARY KEY (term_idx,
pmid));
--Gets publications which cite termA and "termC" 
-- where termC is also associated with a paper which was referenced by termB (this is what the valid_terms table
-- captures).

INSERT
	INTO
	termA_associated_pubs
SELECT
	t2.name as term_name,
	t2.term_idx as term_idx,
	m1.pmid as pmid
FROM
	term_syn ts
INNER JOIN term t1 ON
	ts.term_idx = t1.term_idx
INNER JOIN mentions m1 ON
	t1.term_idx = m1.term_idx
INNER JOIN mentions m2 ON
	m1.pmid = m2.pmid
INNER JOIN term t2 ON
	m2.term_idx = t2.term_idx
INNER JOIN valid_terms ON
	t2.term_idx = valid_terms.term_idx
WHERE
	ts.synonym =:termA
	AND t1.term_idx <> t2.term_idx;
--SELECT COUNT(*) FROM termA_associated_pubs;
--SELECT * FROM termA_associated_pubs LIMIT 19;

INSERT
	INTO
	termB_associated_pubs 
SELECT
	t2.name as term_name,
	t2.term_idx as term_idx,
	m1.pmid as pmid
FROM
	term_syn ts
INNER JOIN term t1 ON
	ts.term_idx = t1.term_idx
INNER JOIN mentions m1 ON
	t1.term_idx = m1.term_idx
INNER JOIN mentions m2 ON
	m1.pmid = m2.pmid
INNER JOIN term t2 ON
	m2.term_idx = t2.term_idx
INNER JOIN valid_terms ON
	t2.term_idx = valid_terms.term_idx
WHERE
	ts.synonym =:termB
	AND t1.term_idx <> t2.term_idx;
--SELECT * FROM term2_associated_pubs LIMIT 10;
--SELECT COUNT(*) FROM term2_associated_pubs;

CREATE TEMP TABLE termA_pub_count (term_name TEXT,
term_idx NUMERIC PRIMARY KEY,
pub_count NUMERIC);

CREATE TEMP TABLE termB_pub_count (term_name TEXT,
term_idx NUMERIC PRIMARY KEY,
pub_count NUMERIC);

CREATE TEMP TABLE overlap_pub_count (term_name TEXT,
term_idx NUMERIC PRIMARY KEY,
pub_count NUMERIC );
--Overlap between both "term a" and "term b". That is papers which are tagged with "term a", "term b" and "term x" 
--which is being returned by the query.
INSERT
	INTO
	overlap_pub_count
SELECT
	termA_associated_pubs.term_name as term_name,
	termA_associated_pubs.term_idx as term_idx,
	COUNT(DISTINCT termA_associated_pubs.pmid) as pub_count
FROM
	termA_associated_pubs
INNER JOIN termB_associated_pubs ON
	termB_associated_pubs.term_idx = termA_associated_pubs.term_idx
	AND
termA_associated_pubs.pmid = termB_associated_pubs.pmid
GROUP BY
	termA_associated_pubs.term_idx;

/*SELECT term1_associated_pubs.term_name as term_name, term1_associated_pubs.term_idx as term_idx, COUNT(DISTINCT term1_associated_pubs.pmid) as pub_count 
FROM temp
LEFT JOIN term1_associated_pubs ON temp.term_idx=term1_associated_pubs.term_idx
INNER JOIN term2_associated_pubs ON term2_associated_pubs.term_idx=term1_associated_pubs.term_idx
WHERE term1_associated_pubs.pmid=term2_associated_pubs.pmid
GROUP BY term1_associated_pubs.term_idx;*/
--"Term a" pubs
INSERT
	INTO
	termA_pub_count 
SELECT
	termA_associated_pubs.term_name,
	termA_associated_pubs.term_idx as term_idx,
	COUNT(termA_associated_pubs.pmid) as pub_count1
FROM
	termA_associated_pubs
GROUP BY
	termA_associated_pubs.term_idx;

INSERT
	INTO
	termB_pub_count 
SELECT
	termB_associated_pubs.term_name,
	termB_associated_pubs.term_idx as term_idx,
	COUNT(termB_associated_pubs.pmid) as pub_count
FROM
	termB_associated_pubs
GROUP BY
	termB_associated_pubs.term_idx;

SELECT
	t.name,
	termA_pub_count.pub_count-IFNULL(overlap_pub_count.pub_count, 0) AS termA_pub_cnt,
	termB_pub_count.pub_count-IFNULL(overlap_pub_count.pub_count, 0) AS termB_pub_cnt,
	IFNULL(overlap_pub_count.pub_count, 0) AS overlap_pub_cnt,
	termA_pub_count.pub_count + termB_pub_count.pub_count-IFNULL(overlap_pub_count.pub_count, 0) AS for_sorting
FROM
	termA_pub_count
INNER JOIN term t ON
	termA_pub_count.term_idx = t.term_idx
INNER JOIN termB_pub_count ON
	termA_pub_count.term_idx = termB_pub_count.term_idx
LEFT JOIN overlap_pub_count ON
	termA_pub_count.term_idx = overlap_pub_count.term_idx
ORDER BY
	overlap_pub_cnt DESC,
	for_sorting DESC;
