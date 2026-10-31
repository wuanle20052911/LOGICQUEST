function backgroundAirships(){return `<div class="air-traffic" aria-hidden="true">${[0,1,2].map(i=>`<div class="airship-route route-${i}"><div class="airship-bob"><span class="airship-wind"></span><img src="assets/airship-orange-2d.png" alt="" draggable="false"><span class="airship-propeller"></span></div></div>`).join('')}</div>`}
const initializeArchipelago=initWorldAtmosphere;
initWorldAtmosphere=function(){initializeArchipelago();document.querySelector('.living-sky')?.insertAdjacentHTML('beforeend',backgroundAirships())};
