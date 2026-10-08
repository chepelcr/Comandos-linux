#!/usr/bin/env python3
"""Guest-only bridge. No external network, arbitrary shell commands or host files."""
import base64,io,json,pathlib,subprocess,tarfile,time,urllib.request,urllib.error
root=pathlib.Path('/opt/course/bridge')
workspace=pathlib.Path('/home/student')
while True:
 try:
  request_path=root/'request.json'
  if not request_path.exists():time.sleep(.15);continue
  request=json.loads(request_path.read_text());request_path.unlink();kind=request.get('type');response={'id':request['id'],'type':kind}
  if kind=='ping':
   response['value']='ready'
  elif kind=='check':
   lesson=request.get('lesson','')
   result=subprocess.run(['/usr/local/bin/course-check',lesson],capture_output=True,text=True,timeout=30)
   response['value']=json.loads(result.stdout)
  elif kind=='export':
   data=io.BytesIO()
   with tarfile.open(fileobj=data,mode='w:gz') as tar:
    def keep(member):
     if any(part in ['node_modules','.npm','.cache','dist'] for part in pathlib.PurePosixPath(member.name).parts) or member.issym() or member.islnk():return None
     return member
    tar.add(workspace,arcname='student',filter=keep)
   if data.tell()>32*1024*1024:raise ValueError('Export exceeds 32 MiB. Remove node_modules/build caches first.')
   response['data']=base64.b64encode(data.getvalue()).decode()
  elif kind=='import':
   data=base64.b64decode(request['data'],validate=True)
   if len(data)>32*1024*1024:raise ValueError('Import too large')
   with tarfile.open(fileobj=io.BytesIO(data),mode='r:gz') as tar:
    members=tar.getmembers()
    if sum(m.size for m in members)>128*1024*1024:raise ValueError('Expanded import too large')
    for m in members:
     if not (m.name=='student' or m.name.startswith('student/')) or m.issym() or m.islnk() or not (m.isfile() or m.isdir()) or '..' in pathlib.PurePosixPath(m.name).parts:raise ValueError('Unsafe archive')
    tar.extractall('/home',members=members,filter='data')
   subprocess.run(['chown','-R','student:student',str(workspace)],check=True)
   response['value']='imported'
  elif kind=='http':
   path=request.get('path','/')
   if not path.startswith('/') or path.startswith('//') or '..' in path:raise ValueError('Invalid local path')
   method=request.get('method','GET')
   if method not in ['GET','POST','PATCH']:raise ValueError('Invalid method')
   if method!='GET' and not path.startswith('/api/notes'):raise ValueError('Only notes can be changed')
   body=json.dumps(request.get('body')).encode() if method!='GET' else None
   req=urllib.request.Request('http://127.0.0.1:3000'+path,data=body,headers={'Content-Type':'application/json'},method=method)
   try:r=urllib.request.urlopen(req,timeout=5)
   except urllib.error.HTTPError as err:r=err
   data=r.read(4*1024*1024)
   response.update({'status':r.status,'data':base64.b64encode(data).decode(),'contentType':r.headers.get('Content-Type','text/plain')})
  else:raise ValueError('Unknown bridge request')
  (root/'response.json').write_text(json.dumps(response))
 except Exception as err:
  try:(root/'response.json').write_text(json.dumps({'id':request.get('id'),'error':str(err)}))
  except Exception:time.sleep(.5)
