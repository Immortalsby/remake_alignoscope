#!/kunden/homepages/30/d191238565/htdocs/python2/bin/python
# -*- coding: utf-8 -*-

####
# Copyright (C) 2006, 2007 Kim Gerdes
# kim AT gerdes. fr
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; either version 2
# of the License, or (at your option) any later version.
#
# This script is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE
# See the GNU General Public License (www.gnu.org) for more details.
#
# You can retrieve a copy of the GNU General Public License
# from http://www.gnu.org/.  For a copy via US Mail, write to the
#     Free Software Foundation, Inc.
#     59 Temple Place - Suite 330,
#     Boston, MA  02111-1307
#     USA
####



#import time, re, sha, Cookie,  sys,codecs
import os, cgitb, cgi, time, urllib
import alignsession
from translations import Trans
from random import choice
#from parTextView import ParTextView

table = "jeanchristophe"
blocknumber = 7058
volumes="460-932-1817-2933-3725-4001-4677-5521-6266"


dirbase = "/alignoscope"
thisFile = "index.cgi"
#dirbase = "/".join(os.environ['SCRIPT_NAME'].split("/")[:-1])
#thisFile = os.environ['SCRIPT_NAME'].split("/")[-1]
stylesheet = "/alignoscope/alignoscopestyle.css" # avec chemin depuis machine
if os.environ.has_key('HTTP_HOST') : machine = os.environ['HTTP_HOST']
else : machine = "miaojun.net" # for style sheet and links
cgitb.enable()
partexturl = "http://miaojun.net/alignoscope/parText.cgi"


try:
	form = cgi.FieldStorage()
	sess = alignsession.Session(expires=365*24*60*60, cookie_path='/')
	#partext = sess.data.get('partext')
except :
	print sess.cookie
	print "Content-Type: text/html\n" # blank line : end of headers
	print """<html>
	<head><title>Alignoscope</title>
	<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8"></head><body><script><!-- 
	alert('We encountered a serious problem with the saved parallel text. Sorry.  - Error:""",sys.exc_info()[0], """');
	--></script>"""
	#partext = None
	
	
shownum = 30
print sess.cookie

lang = os.environ["HTTP_ACCEPT_LANGUAGE"]

manuala = ""

if form.has_key("manuala"): 
	manuala = form.getvalue("manuala","en")
	la = manuala
elif lang.startswith("fr"): la="fr"
elif lang.startswith("zh"): la="zh"
#elif  "fr" in lang: la="fr"
#elif "zh" in lang: la="zh"
else : la = "en"

#la="zh"

trans=Trans(la)
#trans.la=la
_ = trans._

print "Content-Type: text/html\n" # blank line: end of headers


	

######################   head    ###########################

print """<html>
	<head><title>Alignoscope</title>
	<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">"""
print	'<link href="http://' + machine +stylesheet+ '" rel="stylesheet" type="text/css">'
print """<style type="text/css">
	td { border:thin solid #ddd; }
	</style>"""
print '<script src="http://'+machine+dirbase+'/script/alignoscope.js"></script>'
print '<script src="http://'+machine+dirbase+'/script/mootools1.11.js"></script>'
print """<script><!-- 
	baseurl = "http://"""+machine+dirbase+"""\";
	--></script>"""



      
print '</head><body id="body" >'
print '<h1>&nbsp;&nbsp;&nbsp;alignoscope </h1>'

print """<div class='lang'>"""
if la != "en": print """<a onClick="document.getElementById('manuala').value='en';document.getElementsByName('search')[0].submit()" >en</a>"""
if la != "fr": print """<a onClick="document.getElementById('manuala').value='fr';document.getElementsByName('search')[0].submit()" >fr</a>"""
if la != "zh": print """<a onClick="document.getElementById('manuala').value='zh';document.getElementsByName('search')[0].submit()" >中文</a>"""
print """</div>"""
#print la,lang
########### creating the popup

#
print """<DIV ID="popup" class="alipopup"><div id="t" ><TABLE width="100%">
<TR><TD  class="alipopuptable" ID="popupLang0" >
language 0
</TD><TD class="alipopuptable" ID="popupLang1" >
language 1
</TD></TR>
</TABLE></div> </DIV>
"""



########################################### control fields #####################################
print """
	<form method="post" action='"""+thisFile+"""' name="search" style='border:thin solid red; border-spacing:5px ;font-size: small;'>
	<table style='empty-cells:show; width:100%'>
	<tr><td colspan="2">"""+_("Romain Roland: Jean-Christophe - Original")+"""</td>
	<td colspan="2">"""+_("Chinese Translations by Fu Lei (傅雷)")+"""</td></tr>
	<tr>
	<td width="25%" style='font-size: x-small;' 
	title='"""+_("looking for blocks in the source language containing these words")+"""'>
	"""+_("contains:")+"""
	<input name="pos0" id="pos0" value=\""""+form.getvalue("pos0","")+"""\" style="font-size: x-small; height:19px; width:100%;"></td>
	<td width="25%" style='font-size: x-small;' 
	title='"""+_("looking for blocks in the source language NOT containing these words")+"""'>
	"""+_("does not contain:")+"""
	<input name="neg0"  id="neg0" value=\""""+form.getvalue("neg0","")+"""\" style=" font-size: x-small; height:19px;width:100%;"></td>
	<td width="25%" style='font-size: x-small;' 
	title='"""+_("looking for blocks in the target language containing these words")+"""'>
	"""+_("contains:")+"""
	<input name="pos1" id="pos1" value=\""""+form.getvalue("pos1","")+"""\" style="font-size: x-small; height:19px; width:100%;"></td>
	<td width="25%" style='font-size: x-small;' 
	title='"""+_("looking for blocks in the target language NOT containing these words")+"""'>
	"""+_("does not contain:")+"""
	<input name="neg1" id="neg1" value=\""""+form.getvalue("neg1","")+"""\" style=" font-size: x-small; height:19px; width:100%;"></td>
	</tr>
	
	<tr>
	<td></td>
	<td colspan="2">
	<input type="submit" value=" """+_("search")+""" " name="search" class="alibutton" title=" """+_("click here to search!")+""" ">
	</td>
	<td></td>
	</tr></table>"""


pos = (form.getvalue("pos0","").strip() +" "+ form.getvalue("pos1","").strip()).replace("_"," ").replace("|"," ")
neg = (form.getvalue("neg0","").strip() +" "+ form.getvalue("neg1","").strip()).replace("_"," ").replace("|"," ")

print '<input type="hidden" name="table" id="table" value="'+table+'">'
print '<input type="hidden" name="pos" id="pos" value="'+pos+'">'
print '<input type="hidden" name="neg" id="neg" value="'+neg+'">'
print '<input type="hidden" name="manuala" id="manuala" value="'+manuala+'">'

#parTextView=ParTextView(trans)

print """<script><!-- 
	alibuf = new Array("""+str(blocknumber)+""");
	--></script>"""


########################################### search results #####################################

if form.has_key("search") or form.has_key("export") :
	print """<table style='empty-cells:show; width:100%'><tr>
	<td  title='"""+_("the total number of aligned blocks of this bitext")+"""' class="aliresultbox">
	"""+_("Total blocks:")+"""""",blocknumber,"""</td>"""
	params={}
	params["pos0"]=form.getvalue("pos0","")#.decode("utf-8")
	params["neg0"]=form.getvalue("neg0","")#.decode("utf-8")
	params["pos1"]=form.getvalue("pos1","")#.decode("utf-8")
	params["neg1"]=form.getvalue("neg1","")#.decode("utf-8")
	params["shownum"]=shownum
	params["la"]=la
	params["table"]=table
	params["b"]=blocknumber
	params["v"]=volumes
	#print params
	
	

if form.has_key("search")  :
	params["search"]=1
	params=urllib.urlencode(params)
	#print params
	print urllib.urlopen(partexturl, params).read()
	print "<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>"
	
#
########################################### paragraph export #####################################

if form.has_key("export") :	
	params["export"]=1
	
	words = form.getvalue("export")
	if words[-1]==":":#standard button, i.e. button in the standard interface
		words=words[:-1]
		start=0
	elif words[-1]==">":# right button, i.e. button that only appears if there are too many resultas to show at once
		#print form.getvalue("start"+words[0],0)
		words=words[:-4]
		start=int(form.getvalue("start"+words[0]+"r",0))
	else : # left button
		words=words[:-4]
		start=int(form.getvalue("start"+words[0]+"l",0))
	
	#parTextView.export(words,int(form.getvalue(words[0])),start,shownum,
		#form.getvalue("pos0","").decode("utf-8"),form.getvalue("neg0","").decode("utf-8"),
		#form.getvalue("pos1","").decode("utf-8"),form.getvalue("neg1","").decode("utf-8"))
	params["words"]=words
	#params["totnum"]=int(form.getvalue(words[0]))
	params["start"]=start
	#params["words"]=words
	
	
	params=urllib.urlencode(params)
	print urllib.urlopen(partexturl, params).read()
	print "<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>"
	
	


########################################### draw diagram #####################################

#elif form.has_key("search"):
	
	#print parTextView.drawDia(a,a0,a1,p,n)
	


else:  print "</form>"
########################################### technics (explanation, tracking,...) ###############################

print """
<table  width="100%">
<tr  class="row" onClick="ouvre(4,525)" onMouseOver="dessus(4)" onMouseOut="parti(4)">
<td width="33%"></td><td class="row" id=name4 width="34%" style="border-right-color: #FFFFFF;border-left-color: #FFFFFF;">
["""+_("Howto")+"""]
</td><td width="33%"></td>
</tr>
<tr style="display:none" id="idRow4" >
<td  colspan="3" >
	   """
  
trans.manual()
  
print "<br><br><p style='font-size:9pt;'><b><u>Tracking:</u></b><br/>"

# """+_("xxx")+"""

firstvisit = sess.data.get('firstvisit')
lastvisit = sess.data.get('lastvisit')
if firstvisit and lastvisit : 
	therapyduration = float(lastvisit)-float(firstvisit)
	message = _("Welcome back. Your last visit was on ") + 	time.asctime(time.localtime(float(lastvisit))) +""
	print "<br/>"+ _("Your first visit was on ") + time.asctime(time.localtime(float(firstvisit))) +""
	
else : 
	therapyduration = float(0)
	message = '<br/>' + _("New session")
	sess.data['firstvisit'] = repr(time.time())
	firstvisit = repr(time.time())
	lastvisit = repr(time.time())

# Save the current time in the session
sess.data['lastvisit'] = repr(time.time())
print message
print "<br/>sess.cookie : "+str(sess.cookie)+""
for i in sess.data.keys():
	if i=="memoireReponses" or i=="memoireinputsPatient" or i=="memoireTemps" or i=="memoireCas":
		pass
	else : print  "<b>"+i+": </b>"+str(sess.data[i])+"<br/>"

print "<b>Referer:</b>", os.environ.get("HTTP_REFERER", "<not present>")
print "<br/><b>User Agent:</b>", os.environ.get("HTTP_USER_AGENT", "<unknown>")
ipnum = os.environ.get("REMOTE_ADDR", "<not present>")
sess.data['ipnum'] = ipnum
print "<br/><b>IP:</b>", ipnum,"</p>"


print """
</td></tr>
<tr  class="row" onClick="ouvre(5,525)" onMouseOver="dessus(5)" onMouseOut="parti(5)">
<td width="33%"></td><td class="row" id=name5 width="34%" style="border-right-color: #FFFFFF;border-left-color: #FFFFFF;">
["""+_("Presentation")+"""]
</td><td width="33%"></td>
</tr>
<tr style="display:none" id="idRow5" >
<td  colspan="3" >
"""
  
trans.pres()
print """
</td></tr>
</table>
"""


sess.close()

# """+_("xxx")+"""

print """<br/>
<h1 class='bottomline'>&nbsp;&nbsp;&nbsp;alignoscope &nbsp;&nbsp;&nbsp;</h1>
<table class='info' style="width:100%">

<tr>
<td  class='info'>"""+_("idea & alignment by <a href='https://miaojun.net' >Miao Jun</a>")+""" </td>
<td class="emptyinfo"></td class='info'><td class='info'>"""+_("inspired by <a href='http://www.cavi.univ-paris3.fr/ilpga/ilpga/sfleury/page1.htm' class='info'>Serge Fleury</a>'s <a href='http://tal.univ-paris3.fr/mkAlign/' class='info'>MkAlign</a>")+""" </td><td class="emptyinfo"></td ><td class='info'>  """+_("<a href='http://www.nlp.org.cn/project/project.php?proj_id=6' class='info'>ICTCLAS</a> segmented the Chinese words")+"""
</td></tr>
<tr >
<td colspan="5" class='info' >
<img src="images/alignoscope.png" align="absbottom"> """+_("programmed by <a href='http://gerdes.fr'>Kim Gerdes</a> in  <img src='images/javascript.png' align='absbottom'> and <img src='images/python.png' align='absbottom'> on  <img src='images/mysql.png' align='absbottom'> under <img src='images/gpl.png' align='absbottom'> for use in <img src='images/firefox.png' align='absbottom'>")+"""
</td>
</tr>
</table>
</body></html>"""
#<div class='info'></div>













