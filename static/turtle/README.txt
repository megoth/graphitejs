Turtle Terse RDF Triple Language Test Cases

These tests must be passed for systems to be conformant
See http://www.w3.org/2001/sw/DataAccess/df1/tests/
for the full conformance information.

The format is a set of good tests and bad tests.
The tests should be performed with an assumed base URI of
  http://www.w3.org/2001/sw/DataAccess/df1/tests/

Good tests (in manifest.ttl) are a pair of files named:
  test-XX.ttl test-XX.out
The input Turtle file test-XX.ttl MUST generate equivalent RDF
triples to those given in the corresponding test-XX.out N-Triples file.

Bad tests (in manifest-bad.ttl) are files named:
  bad-XX.ttl
which MUST NOT generate any RDF triples.


The tests are governed by the
  Policies for Contribution of Test Cases to W3C
  http://www.w3.org/2004/06/29-testcases

Specifically:
  W3C Patent Policy (5 Feb 2004 Version)
  http://www.w3.org/Consortium/Patent-Policy-20040205/
and
  W3C Copyright Policy
  http://www.w3.org/Consortium/Legal/2002/ipr-notice-20021231#Copyright

Copyright © 2004 W3C ® (MIT,ERCIM, Keio), All Rights Reserved. W3C
liability, trademark, document use and software licensing rules
apply.
