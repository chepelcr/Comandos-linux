#!/usr/bin/env python3
"""Validate observable guest state; never executes learner-supplied shell fragments."""
import json,pathlib,subprocess,sys,urllib.request,urllib.error,ssl,stat,tarfile
home=pathlib.Path('/home/student');practice=home/'practice';repo=practice/'repo';app=home/'linux-lab-notes'
def output(*args):
 try:
  result=subprocess.run(args,capture_output=True,text=True,timeout=15)
  return result.stdout.strip() if result.returncode==0 else None
 except (OSError,subprocess.TimeoutExpired):return None
def command(*args):return output(*args) is not None
def git(path,*args):return output('runuser','-u','student','--','git','-C',str(path),*args)
def http(path='/',port=3000,tls=False):
 try:
  context=ssl.create_default_context(cafile='/opt/course/tls/ca.crt') if tls else None
  with urllib.request.urlopen(('https' if tls else 'http')+'://localhost:'+str(port)+path,timeout=5,context=context) as response:return response.status,response.read(1024*1024).decode(errors='replace')
 except urllib.error.HTTPError as error:return error.code,''
 except Exception:return 0,''
def contains(path,text):
 try:return text in pathlib.Path(path).read_text()
 except (OSError,UnicodeError):return False
def archive_ok():
 try:
  with tarfile.open(practice/'archive.tar.gz') as archive:return archive.extractfile('archive/hello.txt').read()==(practice/'restored/archive/hello.txt').read_bytes()
 except Exception:return False
def node_ready():return (output('node','--version') or '').startswith('v24.') and command('npm','--version')
def api_ready():
 try:return json.loads(http('/api/health')[1]).get('ok') is True and len(json.loads(http('/api/notes')[1]))>0
 except Exception:return False
def react_changed():
  first=git(app,'rev-list','--max-parents=0','HEAD')
  return first and bool(git(app,'diff',first,'--','frontend/src/main.jsx')) and http('/')[0]==200
checks={
 'intro':lambda:contains(practice/'system.txt','Linux'),
 'cli':lambda:contains(practice/'kernel.txt','Linux'),
 'gestion_archivos':lambda:(practice/'files/hello.txt').read_bytes()==(practice/'files/moved.txt').read_bytes(),
 'vi':lambda:bool((practice/'editor.txt').read_text().strip()),
 'compresion':archive_ok,
 'permisos':lambda:stat.S_IMODE((practice/'run.sh').stat().st_mode)==0o750 and contains(practice/'run.sh','echo'),
 'paquetes':node_ready,
 'crear_usuario':lambda:command('id','sysadmin') and 'sudo' in (output('id','-nG','sysadmin') or '').split(),
 'ingreso':lambda:'permitrootlogin no' in (output('sshd','-T') or '') and command('systemctl','is-active','--quiet','ssh'),
 'ssh':lambda:command('runuser','-u','student','--','ssh','-o','BatchMode=yes','-o','StrictHostKeyChecking=accept-new','-i',str(home/'.ssh/id_lab'),'student@127.0.0.1','true'),
 'firewall':lambda:command('iptables','-C','INPUT','-p','tcp','--dport','3000','-j','ACCEPT') and pathlib.Path('/etc/iptables/rules.v4').exists(),
 'fuerza':lambda:command('fail2ban-client','status','sshd'),
 'apache':lambda:command('systemctl','is-active','--quiet','apache2') and http('/',80)[0]==200,
 'php':lambda:'Linux Lab PHP' in http('/course.php',80)[1],
 'mysql':lambda:'course' in (output('mariadb','--batch','--skip-column-names','-e','SHOW DATABASES') or '').splitlines(),
 'phpmyadmin':lambda:pathlib.Path('/etc/phpmyadmin/.htpasswd').exists() and http('/phpmyadmin/',80)[0]==401,
 'obtener':lambda:pathlib.Path('/var/www/html/nextcloud/occ').exists() and (practice/'nextcloud-lab.tar.gz').exists(),
 'descargar':lambda:(practice/'nextcloud-lab.tar.gz').read_bytes()==(practice/'scp-nextcloud.tar.gz').read_bytes(),
 'configurar':lambda:json.loads(http('/status.php',8081)[1]).get('installed') is True,
 'ssl':lambda:http('/',443,True)[0]==200,
 'git_instalacion':lambda:command('git','--version'),
 'git_configuracion':lambda:output('runuser','-u','student','--','git','config','--global','--get','user.name')=='Linux Student',
 'git_ssh':lambda:command('runuser','-u','student','--','ssh','-o','BatchMode=yes','-o','StrictHostKeyChecking=accept-new','-i',str(home/'.ssh/id_lab'),'student@127.0.0.1','git --version'),
 'git_basicos':lambda:bool(git(repo,'log','--oneline')) and (repo/'README.md').exists(),
 'git_remotos':lambda:git(repo,'rev-parse','HEAD')==git(practice/'clone','rev-parse','HEAD') and bool(git(repo,'remote','get-url','origin')),
 'git_ramas':lambda:(repo/'branch.txt').exists() and git(repo,'branch','--show-current')=='main' and not git(repo,'branch','--list','feature/notes'),
 'git_utiles':lambda:contains(practice/'stash.diff','Temporary change') and git(repo,'status','--porcelain')=='',
 'git_errores':lambda:contains(practice/'conflicts/answer.txt','Combined answer') and len((git(practice/'conflicts','rev-list','--parents','-n','1','HEAD') or '').split())==3,
 'git_opcionales':lambda:git(repo,'log','-1','--format=%G?')=='G' and (repo/'signed.txt').exists(),
 'modern-linux-user':lambda:command('id','deploy') and 'sudo' in (output('id','-nG','deploy') or '').split(),
 'modern-linux-access':lambda:command('runuser','-u','student','--','ssh','-o','BatchMode=yes','-o','StrictHostKeyChecking=accept-new','-i',str(home/'.ssh/id_lab'),'student@127.0.0.1','true'),
 'modern-linux-firewall':lambda:command('iptables','-C','INPUT','-p','tcp','--dport','3000','-j','ACCEPT'),
 'modern-linux-protection':lambda:command('fail2ban-client','status','sshd'),
 'modern-node-install':node_ready,
 'modern-project-setup':lambda:(app/'node_modules/react/package.json').exists() and (app/'node_modules/express/package.json').exists(),
 'modern-node-api':api_ready,
 'modern-react-ui':react_changed,
 'modern-production-build':lambda:(app/'frontend/dist/index.html').exists() and http('/')[0]==200,
 'modern-linux-service':lambda:command('systemctl','is-active','--quiet','notes.service') and http('/api/health')[0]==200,
 'modern-local-tls':lambda:json.loads(http('/api/health',443,True)[1]).get('ok') is True,
}
lesson=sys.argv[1] if len(sys.argv)==2 else ''
try:ok=bool(checks[lesson]()) if lesson in checks else False
except Exception:ok=False
print(json.dumps({'lesson':lesson,'verified':ok,'evidence':'guest-state-v2','reason':'Observable guest state passed.' if ok else 'Complete the lesson steps and inspect the service or files.'}))
sys.exit(0 if ok else 1)
