//-
prv=new Array('<div id="SM_prev12"><a href="https://splax.net/game/rs.html">オンライン同時プレイ格闘技バトルロイヤル</a></div>')
nxt=new Array('<div id="SM_next03"><a href="http://splax.net/game/bb.html">オンライン対戦 野球ゲーム</a></div>','<div id="SM_next03"><a href="http://splax.net/game/bb.html">オンライン対戦 野球ゲーム</a></div>','<div id="SM_next04"><a href="http://splax.net/game/sc.html">11vs11 本格サッカーゲーム</a></div>','<div id="SM_next11"><a href="http://splax.net/game/bt.html">多人数同時プレイ 戦車バトル</a></div>')

p_st=Math.floor(Math.random()*prv.length)
n_st=Math.floor(Math.random()*nxt.length)
if(p_st==n_st){
	n_st=Math.floor(Math.random()*nxt.length)
	if(p_st==n_st){
		n_st=Math.floor(Math.random()*nxt.length)
		if(p_st==n_st){
			n_st=Math.floor(Math.random()*nxt.length)
		}
	}
}