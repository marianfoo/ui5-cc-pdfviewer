// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
/* eslint-disable */
var apprtBIdiv, apprtBIstyle;
document.addEventListener("DOMContentLoaded", function() {
    try {
        apprtBIstyle = document.createElement('style');
        apprtBIstyle.type = 'text/css';
        apprtBIstyle.innerHTML =
            '.apprtBIbg {background-color:#636363} ' +
            '.apprtBIcenter {position: absolute;top: 50%;left: 50%;margin-top: -50px;margin-left: -100px;width: 200px;height: 100px;} ' +
            '.apprtBIcir {height: 30px;width: 30px;border-radius:50%;transform: scale(0);background-color:#0854a0;animation: apprtBIscaling 1.8s ease-in-out infinite;display: inline-block;margin:.1rem;} ' +
            '.apprtBIcir:nth-child(0) {animation-delay:0s;} ' +
            '.apprtBIcir:nth-child(1) {animation-delay:0.2s;} ' +
            '.apprtBIcir:nth-child(2) {animation-delay:0.4s;} ' +
            '.apprtBIcir:nth-child(3) {animation-delay:0.6s;} ' +
            '@keyframes apprtBIscaling {0%, 100% {transform: scale(0.2);} 40% {transform: scale(1);} 50% {transform: scale(1);}}';
        document.getElementsByTagName('head')[0].appendChild(apprtBIstyle);
        document.body.classList.add("apprtBIbg");
        apprtBIdiv = document.createElement("div");
        apprtBIdiv.classList.add("apprtBIcenter");
        document.body.appendChild(apprtBIdiv);
        var apprtBIdivc;
        apprtBIdivc = document.createElement("div");
        apprtBIdivc.classList.add('apprtBIcir');
        apprtBIdiv.appendChild(apprtBIdivc);
        apprtBIdivc = document.createElement("div");
        apprtBIdivc.classList.add('apprtBIcir');
        apprtBIdiv.appendChild(apprtBIdivc);
        apprtBIdivc = document.createElement("div");
        apprtBIdivc.classList.add('apprtBIcir');
        apprtBIdiv.appendChild(apprtBIdivc);
        document.body.style.height = "100%";
        document.body.style.width = "100%";
    } catch (e) {}
});
