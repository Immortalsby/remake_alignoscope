#!/kunden/homepages/30/d191238565/htdocs/python2/bin/python
# -*- coding: utf-8 -*-

####
# Copyright (C) 2008-2012 Kim Gerdes
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
#print "Content-Type: text/html\r\n\r\n\r\n\r\nxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
 


























import re, MySQLdb,cgi,cgitb
from translations import Trans
cgitb.enable()

#host = "mysql5-22"

host="db5005908916.hosting-data.io"
user = "dbu804415"
passwd = "Miaojun1234"
db ="dbs4953230"
#table = "jeanchristoph"

#blocknumber = 7058




##can be kicked out if the alignoscope always provides a trans
#def _(text):
	#return text



def search(cList0,ncList0,cList1,ncList1,shownum):
		"""
		searches for 
		cList0: left positive
		ncList0: left negative
		cList1: right positive
		ncList1: right negative
		
		returns index lists:
		allList: matches all
		all0List: matches left
		all1List: matches right
		posList: matches positives
		negList: matches negatives
		"""
		
		allcomm = builtCommand("id",cList0,ncList0,cList1,ncList1)
		allList = getListDB(allcomm)
		printbutton(allList,shownum,"matches")
				
		all0comm = builtCommand("id",cList0,ncList0,"","")
		all0List = getListDB(all0comm)
		printbutton(all0List,shownum,"left matches")
		
		all1comm = builtCommand("id","","",cList1,ncList1)
		all1List = getListDB(all1comm)
		printbutton(all1List,shownum,"right matches")
	
		poscomm = builtCommand("id",cList0,"",cList1,"")
		posList = getListDB(poscomm)
		printbutton(posList,shownum,"positive matches")
	
		negcomm = builtCommand("id",ncList0,"",ncList1,"")
		negList = getListDB(negcomm)
		printbutton(negList,shownum,"negative matches")
	
		return allList,all0List,all1List,posList,negList
    
    
def builtCommand(colon,cList0,ncList0,cList1,ncList1,start=0,show=0):
    		"""
		horrible internal function
		returns single mysql command
		for 4 lists: left positive, left negative, right positive, right negative
		special: 
		only left language has apostrophes or strange ’ apostrophes
		and left language can have single char … at the end of words 
		(work around for error that that char is not identified as word boundary in mysql)
		"""
		
		# used only for french:
		leftbor = "([[:<:]]|[[.apostrophe.]]|’)".decode("utf-8")
		rightbor = "([[.apostrophe.]]|’|…|[[:>:]])".decode("utf-8")
		apo = "([[.apostrophe.]]|’)".decode("utf-8")
		dot = "[[:alnum:]]*"
		
		cList0=cList0.replace("|",rightbor+"|"+leftbor).replace("'",apo).split()
		ncList0=ncList0.replace("|",rightbor+"|"+leftbor).replace("'",apo).split()
		cList1=cList1.split()
		ncList1=ncList1.split()
		
		
		
		if not len(cList0+ncList0+cList1+ncList1):
			return None
		
		deja = False
		rcList0 = ""
		if len(cList0):
			rcList0 = (" `lang0` REGEXP '"+leftbor+(rightbor+"' AND `lang0` REGEXP '"+leftbor).join(cList0)+rightbor+"'").replace("_",rightbor+" "+leftbor).replace(".*",dot)
			deja = True
		#print rcList0.encode("utf-8")
		rncList0 = ""
		if len(ncList0):
			if deja: rncList0=" AND "
			rncList0 += (" `lang0` NOT REGEXP '"+leftbor+(rightbor+"' AND `lang0` NOT REGEXP '"+leftbor).join(ncList0)+rightbor+"'").replace("_"," ").replace(".*",dot)
			deja = True
		
		rcList1 = ""
		if len(cList1):
			if deja: rcList1=" AND "
			rcList1 += (" `lang1` REGEXP '[[:<:]]"+"[[:>:]]' AND `lang1` REGEXP '[[:<:]]".join(cList1)+"[[:>:]]'").replace("_"," ")
			deja = True
		
		rncList1 = ""
		if len(ncList1):
			if deja: rncList1=" AND "
			rncList1 += (" `lang1` NOT REGEXP '[[:<:]]"+"[[:>:]]' AND `lang1` NOT REGEXP '[[:<:]]".join(ncList1)+"[[:>:]]'").replace("_"," ")
			deja = True
		
		
		command = "SELECT "+colon+" FROM "+table
		if deja: command +=  " WHERE"
		command += rcList0+rncList0+rcList1+rncList1
		if show: command +=" LIMIT "+str(start)+","+str(show)
		
		command += ";"
		
		#print "<br>",command.encode("utf-8")
		return command
    
def getListDB(command):
		"""
		gets index list from db for command
		"""
		if command:
			cursor.execute (command)
			return [int(i[0]) for i in cursor.fetchall()]
		else: return None

def printbutton(le,shownum,words):
		"""
		le: number of results
		shownum: numbers to show
		words: value of button
		"""
		if le:le=len(le)
		else:le=-1
		keylet = words[0]
		print """<td class='alisq alisq"""+keylet+""" alisqtd'>&nbsp;
				<input type="submit" title=" """+_("click to export the") ,
		if le>shownum or le==-1: print  " "+_("first"),shownum,
		print words+'" ',
		print 'value="'+words+':" name="export" class="aliminibutton" >', 
		if le==-1:print " "+_("all")
		else:print le
		print '<input type="hidden" name="'+keylet+'" value="'+str(le)+'"></td>'

def drawDia(all,a0,a1,pos,neg):
		
		# t:all, tt:left, ttt:right
		t = '<table style="empty-cells:show; width: 100%;" '
		t+= 'cellpadding="1" cellspacing="3"><tbody>'
		t+='<tr>'
		t+='<td style="border:3px solid grey;" width="50%">'
		tt =''
		ttt=''
		for j in range(blocknumber):
			#print j
			i=j+1
			if i in volumes:
				t += tt+'</td>\n<td  style="border:3px solid grey;" width="50%">'+ttt
				t+='</td></tr>'
				t+='<tr>'
				t+='<td style="border:3px solid grey;" width="50%">'
				tt =''
				ttt=''
			x = "<span id='c' onMouseOut=hideAlign(event) "
			x += "onMouseOver=showAlign(event,'" + str(i)+"',0) "
			x += """onClick='showAlign(event,\"""" + str(i)+"""\",1)' class='alisq """
			tt += x
			ttt+= x
			
			if neg==None or i in neg:	
				tt += "alisqn "
				ttt+= "alisqn "
			elif pos==None or i in pos:	
				tt += "alisqp "
				ttt+= "alisqp "
			if all==None or i in all: 	
				tt += "alisqm "
				ttt+= "alisqm "
			else:
				if a0==None or i in a0:	tt += "alisql "
				if a1==None or i in a1:	ttt+= "alisqr "
			
				
				
			tt += "'>"+u"\u25A1".encode("utf-8") + "</span><span style='font-size:1px;'> </span>" # \u25A1 = square
			ttt+= "'>"+u"\u25A1".encode("utf-8") + "</span><span style='font-size:1px;'> </span>"
			
		t += tt+'</td>\n<td  style="border:3px solid grey;" width="50%">'+ttt
		t+='</td></tr></tbody></table>'
		return t	

def export(words,startnum,shownum,cList0,ncList0,cList1,ncList1):
		"""
		words : search type
		searches for 
		cList0: left positive
		ncList0: left negative
		cList1: right positive
		ncList1: right negative
		
		returns index lists:
		allList: matches all
		all0List: matches left
		all1List: matches right
		posList: matches positives
		negList: matches negatives
		"""
		#print startnum,"_____________________",shownum
		stype=words[0]
		apo = "('|’)".decode("utf-8")
		prex = None
		nrex = None
		totnum = None

		if cList0 or cList1 : 
			prexs = '(?<=\W)('+ "|".join((cList0+" "+cList1).replace(".*","\w*?").replace("'",apo).split()) +')(?=\W)'
			#prexs = '(?<=\W)('+ "|".join(p.decode("utf-8").replace("'",apo).split()) +')(?=\W)'
			#print prexs.encode("utf-8")
			prex = re.compile(prexs, re.IGNORECASE | re.MULTILINE | re.UNICODE)
		if ncList0 or ncList1 : 
			nrexs = '(?<=\W)('+ "|".join((ncList0+" "+ncList1).replace(".*","\w*?").replace("'",apo).split()) +')(?=\W)'
			nrex = re.compile(nrexs, re.IGNORECASE | re.MULTILINE | re.UNICODE)
		
		if stype=="m":
			comm = builtCommand("id,lang0,lang1",cList0,ncList0,cList1,ncList1,startnum,shownum)
			if a : totnum = len(a)
		elif stype=="l":
			comm = builtCommand("id,lang0,lang1",cList0,ncList0,"","",startnum,shownum)
			if a0 : totnum = len(a0)
		elif stype=="r":
			comm = builtCommand("id,lang0,lang1","","",cList1,ncList1,startnum,shownum)
			if a1 : totnum = len(a1)
		elif stype=="p":
			comm = builtCommand("id,lang0,lang1",cList0,"",cList1,"",startnum,shownum)
			if p : totnum = len(p)
		elif stype=="n":
			comm = builtCommand("id,lang0,lang1",ncList0,"",ncList1,"",startnum,shownum)
			if n : totnum = len(n)
		else:return
		
		if not totnum:
			totnum = blocknumber
		
		if not comm: 
			comm = "SELECT id,lang0,lang1 FROM "+table
			comm += " LIMIT "+str(startnum)+","+str(shownum)+";"
		printparags(comm,totnum,startnum,shownum,prex,nrex,words)


def printparags(command,totnum,startnum,shownum,regpos,regneg,words):
		#self.cursor.execute(command)
		if command:cursor.execute(command)
		else:return
		
		posm="<span class='alisqp'>"
		negm="<span class='alisqn'>"
		end = "</span>"
		stype = words[0]
		
		#print """<td class='alisq alisq"""+keylet+""" alisqtd'>&nbsp;
				#<input type="submit" title="click to export the""",
		#if le>shownum : print "first",shownum,
		#print words+'" ',
		#print 'value="'+words+':" name="export" class="aliminibutton" >', le
		#print '<input type="hidden" name="'+keylet+'" value="'+str(le)+'"></td>'
		#print totnum,startnum,shownum
		if totnum <0 : totnum = blocknumber
		last = min(totnum,startnum+shownum)
		#print totnum,startnum,shownum,last
		
		print """<div class='alisq alisq"""+stype+""" aliresults'>&nbsp;"""
		if startnum>0:
			mini = max(0,startnum-shownum)
			print """<input type="submit" title=" """+_("click to see the previous results") ,
			print '" value="'+words+' <<<" name="export" class="aliminibutton" >',
			print '<input type="hidden" name="start'+stype+'l" value="'+str(mini)+'">'
		
		
		print "showing results",startnum+1,"to",last
		print "of a total of",totnum,"results for",words
		
		if last<totnum:
			print """<input type="submit" title=" """+_("click to see the following results") ,
			print '" value="'+words+' >>>" name="export" class="aliminibutton" >',
			print '<input type="hidden" name="start'+stype+'r" value="'+str(last)+'">'
		
		print "</div>"
		print "</form>"
		print '<table width="100%">'
		while True:
			row = cursor.fetchone ()
                	if row == None:
                    		break
			
			
			startnum+=1
			print '<TR><TD colspan="2" class="alipopuptitle" style="padding-top:4px;text-align:center;"> '+str(startnum)+" | ¶ N°"+str(row[0])+'</TD></TR>'
			
			r0=row[1].replace("\n","<br/>")
			#print "=======",p,"========"#,prex.pattern
			if regpos: r0 = regpos.sub(posm+r"\1"+end," "+r0+" ")
			if regneg: r0 = regneg.sub(negm+r"\1"+end," "+r0+" ")
			print '<TR><TD  class="alipopuptable" ID="popupLang0">',r0.encode("utf-8")
			r1=row[2].replace("\n","<br/>")
			if regpos: r1 = regpos.sub(posm+r"\1"+end," "+r1+" ")
			if regneg: r1 = regneg.sub(negm+r"\1"+end," "+r1+" ")
			print '</TD><TD class="alipopuptable" ID="popupLang1">', r1.encode("utf-8")
			print "</TD></TR>"
			
		print '</table>'











form = cgi.FieldStorage()
table=form.getvalue("table","table undefined").decode("utf-8")

#parameters for search:
#search=1&b=7058&la=en&neg0=&neg1=&v=460-932-1817-2933-3725-4001-4677-5521-6266&table=jeanchristophe&shownum=30&pos0=amour&pos1= 
#try: http://gerdes.fr/alignoscope/parText.cgi?search=1&b=7058&la=en&neg0=&neg1=&v=460-932-1817-2933-3725-4001-4677-5521-6266&table=jeanchristophe&shownum=30&pos0=amour&pos1=

pos0=form.getvalue("pos0","").decode("utf-8")
neg0=form.getvalue("neg0","").decode("utf-8")
pos1=form.getvalue("pos1","").decode("utf-8")
neg1=form.getvalue("neg1","").decode("utf-8")
words=form.getvalue("words","").decode("utf-8")
blocknumber=int(form.getvalue("b",0))
volumes=form.getvalue("v","0")#.decode("utf-8")

volumes = [int(v) for v in volumes.split("-")]
#print volumes

#totnum=int(form.getvalue("totnum",0))
start=int(form.getvalue("start",0))
shownum=int(form.getvalue("shownum",0))
la=form.getvalue("la","").decode("utf-8")
_ = Trans(la)._

print "Content-Type: text/html\r\n\r\n" 


connection = MySQLdb.connect(host=host,user=user, passwd=passwd,db=db, charset = "utf8", use_unicode = True)
cursor = connection.cursor()


if form.has_key("search"):
	#print "ooooooooooooooooo"
	a,a0,a1,p,n = search(pos0,neg0,pos1,neg1,shownum)
	print "</tr></table></form>"
	print drawDia(a,a0,a1,p,n)

elif form.has_key("export"):
	a,a0,a1,p,n = search(pos0,neg0,pos1,neg1,shownum)
	
	print "</tr></table>"
	export(words,start,shownum,pos0,neg0,pos1,neg1)
	print "</form>"


















