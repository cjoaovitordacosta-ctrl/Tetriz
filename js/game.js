(function(){
'use strict';
var COLS=10,ROWS=20,S=30;
var SH={I:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],O:[[1,1],[1,1]],T:[[0,1,0],[1,1,1],[0,0,0]],S:[[0,1,1],[1,1,0],[0,0,0]],Z:[[1,1,0],[0,1,1],[0,0,0]],J:[[1,0,0],[1,1,1],[0,0,0]],L:[[0,0,1],[1,1,1],[0,0,0]]};
var COL={I:'#e8e2ff',O:'#ffd23f',T:'#9b3fd1',S:'#5fd35f',Z:'#e8384f',J:'#3fa7d6',L:'#ff7a1a'};
var $=function(i){return document.getElementById(i)};
var cv=$('board'),cx=cv.getContext('2d'),nx=$('nx').getContext('2d'),hd=$('hd').getContext('2d');
var board,cur,next,hold,canHold,bag,score,lines,level,over,paused,running,acc,last,raf,hi=0;

try{hi=+localStorage.getItem('tetris-halloween-hi')||0}catch(e){}
$('hi').textContent=hi;

function cell(c,x,y,s,t,a){
  c.globalAlpha=a||1;
  c.fillStyle=COL[t];c.fillRect(x,y,s,s);
  c.fillStyle='rgba(255,255,255,.35)';c.fillRect(x,y,s,s*.12);c.fillRect(x,y,s*.12,s);
  c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x,y+s*.88,s,s*.12);c.fillRect(x+s*.88,y,s*.12,s);
  c.fillStyle='#1a0f30';
  if(t==='L'){ 
    c.fillRect(x+s*.2,y+s*.25,s*.2,s*.2);c.fillRect(x+s*.6,y+s*.25,s*.2,s*.2);
    c.fillRect(x+s*.25,y+s*.62,s*.5,s*.12);
  }else if(t==='I'){ 
    c.fillRect(x+s*.25,y+s*.28,s*.15,s*.22);c.fillRect(x+s*.6,y+s*.28,s*.15,s*.22);
    c.fillRect(x+s*.43,y+s*.6,s*.14,s*.12);
  }else if(t==='T'){ 
    c.fillStyle='#7dff7a';c.fillRect(x+s*.25,y+s*.35,s*.14,s*.14);c.fillRect(x+s*.61,y+s*.35,s*.14,s*.14);
  }
  c.globalAlpha=1;
}

function newBag(){var b=Object.keys(SH);for(var i=b.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=b[i];b[i]=b[j];b[j]=t}return b}
function draw7(){if(!bag.length)bag=newBag();return bag.pop()}
function piece(t){var m=SH[t].map(function(r){return r.slice()});return{t:t,m:m,x:Math.floor((COLS-m[0].length)/2),y:t==='I'?-1:0}}

function hit(m,x,y){
  for(var r=0;r<m.length;r++)for(var c=0;c<m[r].length;c++){
    if(!m[r][c])continue;
    var X=x+c,Y=y+r;
    if(X<0||X>=COLS||Y>=ROWS)return true;
    if(Y>=0&&board[Y][X])return true;
  }
  return false;
}
function rotM(m,dir){
  var n=m.length,o=m.map(function(r){return r.slice()});
  for(var r=0;r<n;r++)for(var c=0;c<n;c++){if(dir>0)o[c][n-1-r]=m[r][c];else o[n-1-c][r]=m[r][c]}
  return o;
}

function reset(){
  board=[];for(var r=0;r<ROWS;r++)board.push(new Array(COLS).fill(''));
  bag=[];score=0;lines=0;level=1;over=false;paused=false;hold=null;canHold=true;acc=0;
  next=piece(draw7());spawn();upd();
}
function spawn(){
  cur=next;next=piece(draw7());canHold=true;
  if(hit(cur.m,cur.x,cur.y)){end()}
  drawSide();
}
function upd(){$('sc').textContent=score;$('ln').textContent=lines;$('lv').textContent=level}
function speed(){return Math.max(90,800-(level-1)*70)}

function move(dx){if(!hit(cur.m,cur.x+dx,cur.y)){cur.x+=dx;return true}return false}
function rotate(dir){
  var m=rotM(cur.m,dir),k=[0,-1,1,-2,2];
  for(var i=0;i<k.length;i++){if(!hit(m,cur.x+k[i],cur.y)){cur.m=m;cur.x+=k[i];return}}
}
function down(manual){
  if(!hit(cur.m,cur.x,cur.y+1)){cur.y++;if(manual)score+=1;return true}
  lock();return false;
}
function drop(){var n=0;while(!hit(cur.m,cur.x,cur.y+1)){cur.y++;n++}score+=n*2;lock()}
function lock(){
  cur.m.forEach(function(row,r){row.forEach(function(v,c){
    if(v){var Y=cur.y+r;if(Y>=0)board[Y][cur.x+c]=cur.t}
  })});
  var n=0;
  for(var r=ROWS-1;r>=0;r--){
    if(board[r].every(Boolean)){board.splice(r,1);board.unshift(new Array(COLS).fill(''));n++;r++}
  }
  if(n){
    score+=[0,100,300,500,800][n]*level;lines+=n;level=Math.floor(lines/10)+1;
    if(n===4){cv.classList.remove('shake');void cv.offsetWidth;cv.classList.add('shake')}
  }
  upd();spawn();
}
function doHold(){
  if(!canHold)return;
  var t=cur.t;
  if(hold){cur=piece(hold)}else{cur=next;next=piece(draw7())}
  hold=t;canHold=false;drawSide();
}

function ghostY(){var y=cur.y;while(!hit(cur.m,cur.x,y+1))y++;return y}

function render(){
  cx.fillStyle='#0b0516';cx.fillRect(0,0,300,600);
  cx.strokeStyle='#1b1030';cx.lineWidth=1;cx.beginPath();
  for(var i=1;i<COLS;i++){cx.moveTo(i*S+.5,0);cx.lineTo(i*S+.5,600)}
  for(var j=1;j<ROWS;j++){cx.moveTo(0,j*S+.5);cx.lineTo(300,j*S+.5)}
  cx.stroke();
  for(var r=0;r<ROWS;r++)for(var c=0;c<COLS;c++)if(board[r][c])cell(cx,c*S,r*S,S,board[r][c]);
  if(cur&&!over){
    var gy=ghostY();
    cur.m.forEach(function(row,r){row.forEach(function(v,c){
      if(v){
        if(gy+r>=0)cell(cx,(cur.x+c)*S,(gy+r)*S,S,cur.t,.22);
        if(cur.y+r>=0)cell(cx,(cur.x+c)*S,(cur.y+r)*S,S,cur.t);
      }
    })});
  }
}
function mini(ctx,t){
  ctx.clearRect(0,0,96,96);
  if(!t)return;
  var m=SH[t],s=22,w=m[0].length*s,h=m.length*s,ox=(96-w)/2,oy=(96-h)/2;
  m.forEach(function(row,r){row.forEach(function(v,c){if(v)cell(ctx,ox+c*s,oy+r*s,s,t)})});
}
function drawSide(){mini(nx,next&&next.t);mini(hd,hold)}

function loop(now){
  raf=requestAnimationFrame(loop);
  if(!running)return;
  var dt=Math.min(now-last,100);last=now;
  if(!paused&&!over){
    acc+=dt;
    if(acc>=speed()){acc=0;down(false)}
  }
  render();
}

function showOv(t,p,b){$('ovt').textContent=t;$('ovp').textContent=p;$('go').textContent=b;$('ov').hidden=false}
function start(){reset();$('ov').hidden=true;running=true;last=performance.now();$('go').blur()}
function end(){
  over=true;
  var novo=score>hi;
  if(novo){hi=score;$('hi').textContent=hi;try{localStorage.setItem('tetris-halloween-hi',hi)}catch(e){}}
  showOv('Os fantasmas venceram',score+' pontos'+(novo?' · novo recorde!':'')+' · '+lines+' linhas','Jogar de novo');
}
function pause(){
  if(!running||over)return;
  paused=!paused;
  if(paused)showOv('Pausado','Os fantasmas esperam.','Continuar');else $('ov').hidden=true;
}
$('go').addEventListener('click',function(){
  if(over||!running)start();else pause();
});

function act(a){
  if(!running||paused||over)return;
  if(a==='left')move(-1);
  else if(a==='right')move(1);
  else if(a==='down'){down(true);acc=0}
  else if(a==='rot')rotate(1);
  else if(a==='rotb')rotate(-1);
  else if(a==='drop')drop();
  else if(a==='hold')doHold();
}
document.addEventListener('keydown',function(e){
  var k=e.key,m={ArrowLeft:'left',ArrowRight:'right',ArrowDown:'down',ArrowUp:'rot',x:'rot',X:'rot',z:'rotb',Z:'rotb',' ':'drop',c:'hold',C:'hold'};
  if(k==='p'||k==='P'||k==='Escape'){pause();return}
  if((k==='Enter')&&(!running||over)&&document.activeElement!==$('go')){start();return}
  if(m[k]){e.preventDefault();act(m[k])}
});
Array.prototype.forEach.call(document.querySelectorAll('.pad button'),function(b){
  b.addEventListener('pointerdown',function(e){e.preventDefault();act(b.getAttribute('data-a'))});
});
document.addEventListener('visibilitychange',function(){if(document.hidden&&running&&!paused&&!over)pause()});

board=[];for(var r=0;r<ROWS;r++)board.push(new Array(COLS).fill(''));
render();
raf=requestAnimationFrame(loop);
})();
