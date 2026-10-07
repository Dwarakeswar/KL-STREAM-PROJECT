/*
  KL STREAM
  Front-end application: HTML + CSS + JavaScript
  Firebase Authentication: real email/password accounts and password reset emails
  Local Storage: project data such as profile, watchlist, history and subscription

  IMPORTANT: Passwords are never stored in Local Storage. Firebase Authentication
  is responsible for password storage and authentication.
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDlRnpcojYesiSVz4crJ2A9sD85e-eVxJs",
  authDomain: "kl-stream.firebaseapp.com",
  projectId: "kl-stream",
  storageBucket: "kl-stream.firebasestorage.app",
  messagingSenderId: "370608292425",
  appId: "1:370608292425:web:65dc469ca703d613747598",
  measurementId: "G-XMKDX56PMM"
};

const firebaseApp = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(firebaseApp);

const ADMIN_EMAIL = "admin@klstream.com";
const ADMIN_PASSWORD = "admin123";

/*
  These are only sample metadata records. The actual playback is embedded from
  the supplied online video links; KL STREAM does not store video files.
*/
const defaultVideos = [
  {id:1,title:"Big Buck Bunny",category:"Movies",videoId:"aqz-KE-bpKQ",description:"A classic animated short film and a good demonstration of embedded video playback."},
  {id:2,title:"Sintel",category:"Movies",videoId:"eRsGyueVLvQ",description:"An open animated short film created by the Blender Open Movie Project."},
  {id:3,title:"Tears of Steel",category:"Movies",videoId:"R6MlUcmOul8",description:"A science-fiction short film created by the Blender Open Movie Project."},
  {id:4,title:"Elephants Dream",category:"Movies",videoId:"TLkA0RELQ1g",description:"An open animated short film created by the Blender Open Movie Project."},
  {id:5,title:"Cosmos Laundromat",category:"Movies",videoId:"Y-rmzh0PI3c",description:"An animated short film from the Blender Open Movie Project."},
  {id:6,title:"Spring",category:"Movies",videoId:"WhWc3b3KhnY",description:"A visually rich animated short film from the Blender Open Movie Project."},
  {id:7,title:"Agent 327: Operation Barbershop",category:"Movies",videoId:"mN0zPOpADL4",description:"A short animated film created by the Blender Animation Studio."},
  {id:8,title:"Coffee Run",category:"Movies",videoId:"ToC9d8qf6bM",description:"A short animated film from the Blender Animation Studio."},
  {id:9,title:"The Daily Stream",category:"TV Shows",videoId:"M7lc1UVf-VE",description:"A short web-style episode used to demonstrate the TV Shows section."},
  {id:10,title:"Learning Lab",category:"TV Shows",videoId:"zDZFcDGpL4U",description:"An educational talk presented as an episode-style program."},
  {id:11,title:"Inside the Mind",category:"TV Shows",videoId:"arj7oStGLkU",description:"An episode-style program about procrastination and everyday habits."},
  {id:12,title:"Ideas That Inspire",category:"TV Shows",videoId:"qp0HIF3SfI4",description:"An episode-style program about leadership, ideas and communication."},
  {id:13,title:"The Learning Series",category:"TV Shows",videoId:"iG9CE55wbtY",description:"An episode-style program discussing education and creativity."},
  {id:14,title:"Motivation Explained",category:"TV Shows",videoId:"rrkrvAUbU9Y",description:"An episode-style program exploring motivation and human behaviour."},
  {id:15,title:"A Different Perspective",category:"TV Shows",videoId:"D9Ihs241zeg",description:"An episode-style program about stories, assumptions and perspective."},
  {id:16,title:"What Makes a Good Life?",category:"TV Shows",videoId:"8KkKuTCFvzI",description:"An episode-style discussion about happiness and meaningful living."},
  {id:17,title:"ISS Earth View",category:"Live Streams",videoId:"FuuC4dpSQ1M",videoType:"video",description:"Live Earth views from the International Space Station when the feed is available."},
  {id:18,title:"Space Launch Live",category:"Live Streams",videoId:"v9gY7VkVT0w",videoType:"video",description:"Official space-launch coverage presented as a live event stream."},
  {id:19,title:"Space Mission Live",category:"Live Streams",videoId:"jxLT_ckNbIs",videoType:"video",description:"Space mission and launch coverage from a dedicated spaceflight channel."}
];

function seedStorage(){
  if(!localStorage.getItem("users")) localStorage.setItem("users", JSON.stringify([]));
  if(!localStorage.getItem("submissions")) localStorage.setItem("submissions", JSON.stringify([]));

  const seedVersion = "2";
  const storedVersion = localStorage.getItem("klStreamVideoSeedVersion");
  if(!localStorage.getItem("videos")){
    localStorage.setItem("videos", JSON.stringify(defaultVideos));
    localStorage.setItem("klStreamVideoSeedVersion", seedVersion);
  }else if(storedVersion !== seedVersion){
    const current = JSON.parse(localStorage.getItem("videos") || "[]");
    const customVideos = current.filter(v => !defaultVideos.some(d => Number(d.id) === Number(v.id)));
    localStorage.setItem("videos", JSON.stringify([...defaultVideos, ...customVideos]));
    localStorage.setItem("klStreamVideoSeedVersion", seedVersion);
  }
}
seedStorage();

function getUsers(){ return JSON.parse(localStorage.getItem("users") || "[]"); }
function saveUsers(value){ localStorage.setItem("users", JSON.stringify(value)); }
function getVideos(){ return JSON.parse(localStorage.getItem("videos") || "[]"); }
function saveVideos(value){ localStorage.setItem("videos", JSON.stringify(value)); }
function getSubmissions(){ return JSON.parse(localStorage.getItem("submissions") || "[]"); }
function saveSubmissions(value){ localStorage.setItem("submissions", JSON.stringify(value)); }
function getCurrentUser(){ return JSON.parse(localStorage.getItem("currentUser") || "null"); }
function saveCurrentUser(value){ localStorage.setItem("currentUser", JSON.stringify(value)); }
function clearViewingUnlock(){ sessionStorage.removeItem("klStreamParentalUnlocked"); }
function isViewingUnlocked(){ return sessionStorage.getItem("klStreamParentalUnlocked") === "true"; }
function setViewingUnlocked(){ sessionStorage.setItem("klStreamParentalUnlocked", "true"); }

function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[c]));
}

function firebaseErrorMessage(error){
  const code = error?.code || "";
  const messages = {
    "auth/email-already-in-use":"This email is already registered. Please log in instead.",
    "auth/invalid-email":"Please enter a valid email address.",
    "auth/weak-password":"Password must contain at least 6 characters.",
    "auth/invalid-credential":"Invalid email or password.",
    "auth/user-not-found":"Invalid email or password.",
    "auth/wrong-password":"Invalid email or password.",
    "auth/too-many-requests":"Too many attempts. Please wait a while and try again.",
    "auth/network-request-failed":"Network error. Please check your internet connection.",
    "auth/operation-not-allowed":"Email/password sign-in is not enabled in the Firebase project. Enable it in Firebase Authentication.",
    "auth/configuration-not-found":"Firebase Authentication is not configured correctly for this project."
  };
  return messages[code] || "Authentication failed. Please try again.";
}

function showSignup(){
  document.getElementById("loginSection")?.classList.add("hidden");
  document.getElementById("signupSection")?.classList.remove("hidden");
}
function showLogin(){
  document.getElementById("signupSection")?.classList.add("hidden");
  document.getElementById("loginSection")?.classList.remove("hidden");
}

async function signup(){
  const name = document.getElementById("signupName")?.value.trim();
  const email = document.getElementById("signupEmail")?.value.trim().toLowerCase();
  const password = document.getElementById("signupPassword")?.value;
  const message = document.getElementById("signupMessage");

  if(!name || !email || !password){ message.textContent="Please fill all fields."; return; }
  if(!/^\S+@\S+\.\S+$/.test(email)){ message.textContent="Please enter a valid email."; return; }
  if(password.length < 6){ message.textContent="Password must contain at least 6 characters."; return; }
  if(email === ADMIN_EMAIL){ message.textContent="Please choose another email."; return; }

  try{
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = credential.user;
    const users = getUsers();

    const profile = {
      id: firebaseUser.uid,
      name,
      email: firebaseUser.email,
      role:"user",
      watchlist:[],
      history:[],
      subscription:false,
      parentalControl:false,
      parentalPin:"",
      createdAt:new Date().toISOString()
    };

    const existingIndex = users.findIndex(u => u.id === firebaseUser.uid || u.email === firebaseUser.email);
    if(existingIndex >= 0) users[existingIndex] = {...users[existingIndex], ...profile};
    else users.push(profile);
    saveUsers(users);
    saveCurrentUser(profile);
    clearViewingUnlock();

    message.textContent="Account created successfully. Redirecting...";
    document.getElementById("signupName").value="";
    document.getElementById("signupEmail").value="";
    document.getElementById("signupPassword").value="";
    setTimeout(() => location.href="home.html", 500);
  }catch(error){
    message.textContent = firebaseErrorMessage(error);
  }
}

async function login(){
  const email = document.getElementById("loginEmail")?.value.trim().toLowerCase();
  const password = document.getElementById("loginPassword")?.value;
  const message = document.getElementById("loginMessage");

  if(!email || !password){ message.textContent="Please enter email and password."; return; }

  if(email === ADMIN_EMAIL && password === ADMIN_PASSWORD){
    saveCurrentUser({id:"ADMIN",name:"Administrator",email,role:"admin"});
    location.href="admin.html";
    return;
  }

  try{
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = credential.user;
    const users = getUsers();
    let profile = users.find(u => u.id === firebaseUser.uid || u.email === firebaseUser.email);

    if(!profile){
      profile = {
        id:firebaseUser.uid,
        name:firebaseUser.displayName || "User",
        email:firebaseUser.email,
        role:"user",
        watchlist:[],
        history:[],
        subscription:false,
        parentalControl:false,
        parentalPin:"",
        createdAt:new Date().toISOString()
      };
      users.push(profile);
      saveUsers(users);
    }else{
      profile = {...profile, id:firebaseUser.uid, email:firebaseUser.email};
    }

    saveCurrentUser(profile);
    clearViewingUnlock();
    location.href="home.html";
  }catch(error){
    message.textContent = firebaseErrorMessage(error);
  }
}

async function forgotPassword(){
  const email = document.getElementById("loginEmail")?.value.trim().toLowerCase();
  const message = document.getElementById("loginMessage");
  if(!email){ message.textContent="Enter your registered email first."; return; }

  try{
    await sendPasswordResetEmail(auth, email);
    message.textContent="Password reset email sent. Open the email and follow the link to choose a new password.";
  }catch(error){
    if(error?.code === "auth/user-not-found"){
      message.textContent="No account was found for this email address.";
    }else{
      message.textContent=firebaseErrorMessage(error);
    }
  }
}

async function logout(){
  try{ await signOut(auth); }catch(error){ console.warn(error); }
  localStorage.removeItem("currentUser");
  clearViewingUnlock();
  location.href="index.html";
}

function requireUser(){
  const user = getCurrentUser();
  if(!user || user.role !== "user"){ location.href="index.html"; return null; }
  return user;
}
function requireAdmin(){
  const user = getCurrentUser();
  if(!user || user.role !== "admin"){ location.href="index.html"; return null; }
  return user;
}

function parseVideoUrl(url){
  try{
    const u = new URL(url.trim());
    const host = u.hostname.toLowerCase();
    if(host === "youtu.be" || host.endsWith(".youtu.be")){
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? {type:"video", videoId:id} : null;
    }
    if(host.includes("youtube.com")){
      if(u.pathname === "/watch"){
        const id = u.searchParams.get("v");
        return id ? {type:"video", videoId:id} : null;
      }
      if(u.pathname.startsWith("/live/")){
        const id = u.pathname.split("/")[2];
        return id ? {type:"video", videoId:id} : null;
      }
      if(u.pathname.startsWith("/embed/")){
        const id = u.pathname.split("/")[2];
        return id ? {type:"video", videoId:id} : null;
      }
      if(u.pathname.startsWith("/shorts/")){
        const id = u.pathname.split("/")[2];
        return id ? {type:"video", videoId:id} : null;
      }
      const channelMatch = u.pathname.match(/^\/channel\/([^/]+)\/live\/?$/);
      if(channelMatch) return {type:"channelLive", channelId:channelMatch[1]};
      const handleMatch = u.pathname.match(/^\/@[^/]+\/live\/?$/);
      if(handleMatch) return null; // handle URLs do not expose a channel ID without an API lookup
    }
  }catch(error){}
  return null;
}

function getVideoEmbedUrl(video){
  if(video.videoType === "channelLive" && video.channelId){
    return `https://www.youtube.com/embed/live_stream?channel=${encodeURIComponent(video.channelId)}`;
  }
  return `https://www.youtube.com/embed/${encodeURIComponent(video.videoId)}`;
}

function getVideoExternalUrl(video){
  if(video.videoType === "channelLive" && video.channelId){
    return `https://www.youtube.com/channel/${encodeURIComponent(video.channelId)}/live`;
  }
  return `https://www.youtube.com/watch?v=${encodeURIComponent(video.videoId)}`;
}

function videoCard(video){
  const current = getCurrentUser();
  const saved = current?.watchlist?.includes(video.id);
  return `
    <article class="video-card">
      <img src="${video.videoId ? `https://i.ytimg.com/vi/${encodeURIComponent(video.videoId)}/hqdefault.jpg` : "https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg"}" alt="${escapeHtml(video.title)}">
      <div class="video-content">
        <span class="badge">${escapeHtml(video.category)}</span>
        <h3>${escapeHtml(video.title)}</h3>
        <p>${escapeHtml(video.description)}</p>
        <div class="video-actions">
          <button class="btn primary" onclick="watchVideo(${Number(video.id)})">Watch</button>
          <button class="btn secondary" onclick="toggleWatchlist(${Number(video.id)})">${saved ? "✓ Saved" : "+ Watchlist"}</button>
        </div>
      </div>
    </article>`;
}

function displayVideos(){
  const list = document.getElementById("videoList");
  if(!list) return;
  const search = (document.getElementById("searchInput")?.value || "").toLowerCase();
  const category = document.getElementById("categoryFilter")?.value || "All";
  const videos = getVideos().filter(v => {
    const matchesText = `${v.title} ${v.description}`.toLowerCase().includes(search);
    const matchesCategory = category === "All" || v.category === category;
    return matchesText && matchesCategory;
  });
  list.innerHTML = videos.length ? videos.map(videoCard).join("") : `<div class="empty-state">No videos match your search.</div>`;
  const count = document.getElementById("heroVideoCount");
  if(count) count.textContent = getVideos().length + "+";
}

function displayRecommendations(){
  const list = document.getElementById("recommendationList");
  if(!list) return;
  const user = requireUser();
  if(!user) return;

  const all = getVideos();
  const watchlist = new Set(user.watchlist || []);
  const history = new Set(user.history || []);
  const preferredCategories = all.filter(v => history.has(v.id) || watchlist.has(v.id)).map(v=>v.category);
  const ranked = all
    .filter(v => !watchlist.has(v.id))
    .sort((a,b) => {
      const as = preferredCategories.includes(a.category) ? 1 : 0;
      const bs = preferredCategories.includes(b.category) ? 1 : 0;
      return bs-as;
    }).slice(0,4);
  list.innerHTML = ranked.map(videoCard).join("");
}

function requestParentalPin(actionText="watch videos"){
  const user = getCurrentUser();
  if(!user?.parentalControl) return true;
  if(isViewingUnlocked()) return true;

  const entered = prompt(`Parental Control is enabled. Enter your 4-digit PIN to ${actionText}.`);
  if(entered === null) return false;
  if(entered.trim() !== user.parentalPin){
    alert("Incorrect PIN. Access is blocked.");
    return false;
  }

  setViewingUnlocked();
  return true;
}

function watchVideo(id){
  const user = requireUser();
  if(!user) return;
  if(!requestParentalPin("watch this video")) return;
  location.href = `watch.html?id=${encodeURIComponent(id)}`;
}

function toggleWatchlist(id){
  const user = requireUser();
  if(!user) return;
  const users = getUsers();
  const index = users.findIndex(u => u.id === user.id);
  if(index < 0) return;
  users[index].watchlist = users[index].watchlist || [];
  if(users[index].watchlist.includes(id)){
    users[index].watchlist = users[index].watchlist.filter(x => x !== id);
  }else{
    users[index].watchlist.push(id);
  }
  saveUsers(users);
  saveCurrentUser(users[index]);
  displayVideos();
  displayRecommendations();
  displayWatchlist();
  loadWatchPage();
}

function displayWatchlist(){
  const list = document.getElementById("watchlist");
  if(!list) return;
  const user = requireUser();
  if(!user) return;
  const videos = getVideos().filter(v => (user.watchlist||[]).includes(v.id));
  list.innerHTML = videos.length ? videos.map(videoCard).join("") :
    `<div class="empty-state"><h3>Your watchlist is empty</h3><p>Add videos from the home page to watch them later.</p><a class="btn primary" href="home.html">Browse Videos</a></div>`;
}

function loadWatchPage(){
  const player = document.getElementById("videoPlayer");
  if(!player) return;
  const user = requireUser();
  if(!user) return;

  const id = Number(new URLSearchParams(location.search).get("id"));
  const video = getVideos().find(v => Number(v.id) === id);
  if(!video){
    document.getElementById("watchTitle").textContent="Video not found";
    return;
  }

  if(!requestParentalPin("watch this video")){
    location.href="home.html";
    return;
  }

  document.getElementById("watchTitle").textContent=video.title;
  document.getElementById("watchDescription").textContent=video.description;
  document.getElementById("watchCategory").textContent=video.category;
  player.src=`${getVideoEmbedUrl(video)}?rel=0`;
  document.getElementById("youtubeLink").href=getVideoExternalUrl(video);

  const button = document.getElementById("watchlistButton");
  button.textContent = (user.watchlist||[]).includes(video.id) ? "✓ Remove from Watchlist" : "Add to Watchlist";
  window.currentWatchId = video.id;

  const users = getUsers();
  const index = users.findIndex(u=>u.id===user.id);
  if(index >= 0){
    users[index].history = users[index].history || [];
    if(!users[index].history.includes(video.id)) users[index].history.unshift(video.id);
    users[index].history = users[index].history.slice(0,20);
    saveUsers(users);
    saveCurrentUser(users[index]);
  }
}

function toggleCurrentWatchlist(){ if(window.currentWatchId) toggleWatchlist(window.currentWatchId); }
function goHome(){ location.href="home.html"; }

function subscribeUser(){
  const user = requireUser();
  if(!user) return;
  const users = getUsers();
  const i=users.findIndex(u=>u.id===user.id);
  if(i<0)return;
  users[i].subscription=true;
  saveUsers(users);
  saveCurrentUser(users[i]);
  displayProfile();
}

function setParentalControl(){
  const user=requireUser();
  if(!user)return;
  const pin=document.getElementById("parentalPin")?.value.trim();
  if(!/^\d{4}$/.test(pin||"")){alert("Please enter a 4-digit PIN.");return;}
  const users=getUsers();
  const i=users.findIndex(u=>u.id===user.id);
  if(i<0)return;
  users[i].parentalControl=true;
  users[i].parentalPin=pin;
  saveUsers(users);
  saveCurrentUser(users[i]);
  clearViewingUnlock();
  document.getElementById("parentalPin").value="";
  displayProfile();
}

function unlockParentalControl(){
  const user=requireUser();
  if(!user)return;
  if(!user.parentalControl){ alert("Parental Control is already disabled."); return; }
  const entered=document.getElementById("parentalPin")?.value.trim();
  if(entered !== user.parentalPin){ alert("Incorrect PIN."); return; }
  setViewingUnlocked();
  document.getElementById("parentalPin").value="";
  const message=document.getElementById("parentalMessage");
  if(message) message.textContent="Viewing unlocked for this browser session. The protection is still enabled.";
}

function disableParentalControl(){
  const user=requireUser();
  if(!user)return;
  if(!user.parentalControl){ return; }
  const entered=document.getElementById("parentalPin")?.value.trim();
  if(entered !== user.parentalPin){ alert("Incorrect PIN. Parental Control was not disabled."); return; }

  const users=getUsers();
  const i=users.findIndex(u=>u.id===user.id);
  if(i<0)return;
  users[i].parentalControl=false;
  users[i].parentalPin="";
  saveUsers(users);
  saveCurrentUser(users[i]);
  clearViewingUnlock();
  document.getElementById("parentalPin").value="";
  displayProfile();
}

function displayProfile(){
  const user=requireUser();
  if(!user)return;
  const name=document.getElementById("profileName");
  const email=document.getElementById("profileEmail");
  if(name)name.textContent=user.name;
  if(email)email.textContent=user.email;

  const sub=document.getElementById("subscriptionStatus");
  const btn=document.getElementById("subscribeButton");
  if(sub){
    sub.textContent=user.subscription?"Subscription: Active":"Subscription: Not Active";
    sub.classList.toggle("active",!!user.subscription);
  }
  if(btn){
    btn.textContent=user.subscription?"Pro Subscription Active":"Subscribe to Pro";
    btn.disabled=!!user.subscription;
  }

  const pc=document.getElementById("parentalStatus");
  const unlockBtn=document.getElementById("unlockParentalButton");
  const disableBtn=document.getElementById("disableParentalButton");
  if(pc){
    pc.textContent=user.parentalControl?"Parental Control: Enabled":"Parental Control: Disabled";
    pc.classList.toggle("active",!!user.parentalControl);
  }
  if(unlockBtn) unlockBtn.disabled=!user.parentalControl;
  if(disableBtn) disableBtn.disabled=!user.parentalControl;
}

function submitVideo(){
  const user=requireUser();
  if(!user)return;
  const title=document.getElementById("submitTitle")?.value.trim();
  const category=document.getElementById("submitCategory")?.value;
  const url=document.getElementById("submitUrl")?.value.trim();
  const description=document.getElementById("submitDescription")?.value.trim();
  const message=document.getElementById("submitMessage");
  const parsed=parseVideoUrl(url||"");
  if(!title||!category||!url||!description){message.textContent="Please fill all fields.";return;}
  if(!parsed){message.textContent=category === "Live Streams" ? "Please enter a valid live video or channel live link." : "Please enter a valid video link.";return;}
  if(category === "Live Streams" && parsed.type === "channelLive"){
    // Channel live URLs are supported when the URL contains the channel ID.
  }

  const submissions=getSubmissions();
  submissions.push({id:"S"+Date.now(),userId:user.id,userName:user.name,userEmail:user.email,title,category,url,...parsed,description,status:"Pending",createdAt:new Date().toISOString()});
  saveSubmissions(submissions);
  message.textContent="Submitted successfully. Waiting for admin approval.";
  ["submitTitle","submitUrl","submitDescription"].forEach(id=>document.getElementById(id).value="");
  document.getElementById("submitCategory").value="";
  displayMySubmissions();
}

function displayMySubmissions(){
  const list=document.getElementById("mySubmissions");
  if(!list)return;
  const user=requireUser();
  if(!user)return;
  const mine=getSubmissions().filter(s=>s.userId===user.id).reverse();
  if(!mine.length){list.innerHTML=`<div class="empty-state">You have not uploaded any videos yet.</div>`;return;}
  list.innerHTML=mine.map(s=>`
    <div class="admin-item">
      <div><h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.category)} • ${escapeHtml(s.description)}</p></div>
      <span class="status-pill ${s.status==="Approved"?"active":""}">${escapeHtml(s.status)}</span>
    </div>`).join("");
}

function approveSubmission(id){
  if(!requireAdmin())return;
  const submissions=getSubmissions();
  const i=submissions.findIndex(s=>s.id===id);
  if(i<0)return;
  const s=submissions[i];
  const videos=getVideos();
  if(!videos.some(v=>v.videoId===s.videoId)){
    videos.push({id:Date.now(),title:s.title,category:s.category,videoId:s.videoId,videoType:s.type,channelId:s.channelId,description:s.description,submittedBy:s.userName});
    saveVideos(videos);
  }
  s.status="Approved";
  saveSubmissions(submissions);
  displayAdmin();
}

function rejectSubmission(id){
  if(!requireAdmin())return;
  const submissions=getSubmissions();
  const i=submissions.findIndex(s=>s.id===id);
  if(i<0)return;
  submissions[i].status="Rejected";
  saveSubmissions(submissions);
  displayAdmin();
}

function deleteSubmission(id){
  if(!requireAdmin())return;
  saveSubmissions(getSubmissions().filter(s=>s.id!==id));
  displayAdmin();
}

function deleteVideo(id){
  if(!requireAdmin())return;
  saveVideos(getVideos().filter(v=>v.id!==id));
  const users=getUsers().map(u=>({...u,watchlist:(u.watchlist||[]).filter(x=>x!==id),history:(u.history||[]).filter(x=>x!==id)}));
  saveUsers(users);
  displayAdmin();
}

function displayAdminVideos(){
  const list=document.getElementById("adminVideoList");
  if(!list)return;
  const q=(document.getElementById("adminSearch")?.value||"").toLowerCase();
  const videos=getVideos().filter(v=>`${v.title} ${v.category}`.toLowerCase().includes(q));
  list.innerHTML=videos.map(v=>`
    <div class="admin-item">
      <div><h3>${escapeHtml(v.title)}</h3><p>${escapeHtml(v.category)} • Video ID: ${escapeHtml(v.videoId)}</p></div>
      <div class="admin-actions"><a class="btn secondary" target="_blank" rel="noopener" href="https://www.youtube.com/watch?v=${encodeURIComponent(v.videoId)}">Open Video</a><button class="btn danger" onclick="deleteVideo(${Number(v.id)})">Delete</button></div>
    </div>`).join("");
}

function displayAdmin(){
  if(!requireAdmin())return;
  const users=getUsers(),videos=getVideos(),submissions=getSubmissions();
  document.getElementById("statUsers").textContent=users.length;
  document.getElementById("statVideos").textContent=videos.length;
  document.getElementById("statPending").textContent=submissions.filter(s=>s.status==="Pending").length;
  document.getElementById("statSubscribers").textContent=users.filter(u=>u.subscription).length;

  const sl=document.getElementById("submissionList");
  const pending=submissions.filter(s=>s.status==="Pending");
  sl.innerHTML=pending.length?pending.map(s=>`
    <div class="admin-item">
      <div><h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.category)} • by ${escapeHtml(s.userName)} • ${escapeHtml(s.userEmail)}</p><p>${escapeHtml(s.description)}</p></div>
      <div class="admin-actions"><button class="btn primary" onclick="approveSubmission('${s.id}')">Approve</button><button class="btn danger" onclick="rejectSubmission('${s.id}')">Reject</button></div>
    </div>`).join(""):`<div class="empty-state">No pending creator uploads.</div>`;

  displayAdminVideos();
  const ul=document.getElementById("adminUserList");
  ul.innerHTML=users.length?users.map(u=>`
    <div class="user-row">
      <strong>${escapeHtml(u.name)}</strong><span>${escapeHtml(u.email)}</span>
      <span>${u.subscription?"Pro":"Free"}</span><span>${u.watchlist?.length||0} saved</span>
    </div>`).join(""):`<div class="empty-state">No registered users on this browser.</div>`;
}

function initPage(){
  const page=location.pathname.split("/").pop() || "index.html";
  if(page==="index.html" || page==="") return;
  if(page==="admin.html"){displayAdmin();return;}
  if(["home.html","watch.html","watchlist.html","submit.html","profile.html"].includes(page)){
    const user=requireUser();
    if(!user)return;
  }
  if(page==="home.html"){displayVideos();displayRecommendations();}
  if(page==="watch.html")loadWatchPage();
  if(page==="watchlist.html")displayWatchlist();
  if(page==="submit.html")displayMySubmissions();
  if(page==="profile.html")displayProfile();
}

/* Keep the Firebase Auth session and the local project session aligned when possible. */
onAuthStateChanged(auth, firebaseUser => {
  const current = getCurrentUser();
  if(!firebaseUser && current?.role === "user"){
    localStorage.removeItem("currentUser");
    clearViewingUnlock();
  }
});

window.addEventListener("DOMContentLoaded",initPage);

Object.assign(window,{
  showSignup,showLogin,signup,login,forgotPassword,logout,
  displayVideos,watchVideo,toggleWatchlist,toggleCurrentWatchlist,goHome,
  subscribeUser,setParentalControl,unlockParentalControl,disableParentalControl,
  submitVideo,approveSubmission,rejectSubmission,deleteSubmission,deleteVideo,
  displayAdminVideos
});
