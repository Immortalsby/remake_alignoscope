// app/static/js/utils.js
// DOM 选择器
const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

// AJAX 函数
async function fetchJSON(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// 工具函数
const Utils = {
    extend: (target, ...sources) => Object.assign(target, ...sources),
    
    addEvent: (element, event, handler) => {
        element.addEventListener(event, handler);
    },
    
    removeEvent: (element, event, handler) => {
        element.removeEventListener(event, handler);
    },
    
    addClass: (element, className) => {
        element.classList.add(className);
    },
    
    removeClass: (element, className) => {
        element.classList.remove(className);
    },
    
    toggleClass: (element, className) => {
        element.classList.toggle(className);
    },
    
    getStyle: (element, style) => {
        return window.getComputedStyle(element)[style];
    },
    
    setStyle: (element, styles) => {
        Object.assign(element.style, styles);
    }
};

// 动画函数
const Fx = {
    animate: (element, properties, duration = 300, callback) => {
        element.style.transition = `all ${duration}ms`;
        Utils.setStyle(element, properties);
        
        const onTransitionEnd = () => {
            element.style.transition = '';
            if (callback) callback();
            element.removeEventListener('transitionend', onTransitionEnd);
        };
        
        element.addEventListener('transitionend', onTransitionEnd);
    }
};