// app/static/js/utils.js
// 确保 jQuery 已加载
if (typeof jQuery === 'undefined') {
    throw new Error('jQuery is required');
}

// 工具类
window.Utils = {
    // AJAX 工具函数
    fetchJSON: async function(url, options = {}) {
        try {
            const response = await $.ajax({
                url: url,
                type: options.method || 'GET',
                data: options.body ? JSON.parse(options.body) : null,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                beforeSend: function(xhr) {
                    if (options.signal) {
                        options.signal.addEventListener('abort', () => xhr.abort());
                    }
                }
            });
            return response;
        } catch (error) {
            if (error.statusText !== 'abort') {
                console.error('Error:', error);
                throw error;
            }
            return null;
        }
    },

    // DOM 操作工具函数
    addClass: function(element, className) {
        $(element).addClass(className);
    },

    removeClass: function(element, className) {
        $(element).removeClass(className);
    },

    toggleClass: function(element, className) {
        $(element).toggleClass(className);
    },

    // 动画效果
    fadeIn: function(element, duration = 300) {
        $(element).fadeIn(duration);
    },

    fadeOut: function(element, duration = 300) {
        $(element).fadeOut(duration);
    },

    slideDown: function(element, duration = 300) {
        $(element).slideDown(duration);
    },

    slideUp: function(element, duration = 300) {
        $(element).slideUp(duration);
    },

    // 事件处理
    addEvent: function(element, event, handler) {
        $(element).on(event, handler);
    },

    removeEvent: function(element, event, handler) {
        $(element).off(event, handler);
    }
};