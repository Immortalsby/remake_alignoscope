// 全局变量
window.ajalist = window.ajalist || [];
window.keep = window.keep || 0;
window.alibuf = window.alibuf || new Array(7058);

// 定义卷的分界点
const volumes = [460, 932, 1817, 2933, 3725, 4001, 4677, 5521, 6266];

// 在 showAlign 函数中添加引号标准化函数
const normalizeQuotes = (text) => {
    const quotes = ["'", "’", "‘", "`", "′", "‵", "՚", "＇", "｀"];  // 与后端保持一致的引号列表
    let result = text;
    quotes.forEach(quote => {
        result = result.replace(quote, "'");
    });
    return result;
};

// 显示对齐文本
window.showAlign = window.showAlign || async function (e, id, k) {
    const $popup = $('#popup');
    const $log = $('#t');

    // 如果点击的是同一个方块，则关闭popup
    if (window.keep === 1 && window.currentId === id) {
        window.keep = 0;
        window.currentId = null;
        $popup.css('visibility', 'hidden')
            .removeClass('popup-fixed');
        return;
    }

    // 记录当前显示的方块ID
    window.currentId = id;
    window.keep = k;

    // 取有正在进行的请求
    try {
        window.ajalist.forEach(controller => {
            if (!controller.signal.aborted) {
                controller.abort();
            }
        });
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Error:', error);
        }
    }
    window.ajalist = [];

    // 显示加载状态
    $log.empty().addClass('ajax-loading');

    const currentTable = $('#table-select').val();
    const controller = new AbortController();
    window.ajalist.push(controller);

    try {
        // 每次都重新获取数据，不使用缓存
        const data = await Utils.fetchJSON(`/align/${id}?table=${currentTable}`, {
            signal: controller.signal
        });

        if (data) {
            const searchTerms = {
                pos0: $('#pos0').val(),
                neg0: $('#neg0').val(),
                pos1: $('#pos1').val(),
                neg1: $('#neg1').val()
            };

            let { lang0, lang1 } = data;

            // 修改高亮处理部分
            if (searchTerms.pos0 || searchTerms.pos1) {
                const terms = [];
                if (searchTerms.pos0) {
                    terms.push(...searchTerms.pos0.split(/\s+/).filter(term => term));
                }
                if (searchTerms.pos1) {
                    terms.push(...searchTerms.pos1.split(/\s+/).filter(term => term));
                }
                console.log('搜索词:', terms);  // 添加日志
                
                terms.forEach(term => {
                    const subTerms = term.split('|');
                    subTerms.forEach(subTerm => {
                        if (subTerm.trim()) {
                            const isChinese = /[\u4e00-\u9fa5]/.test(subTerm);
                            if (isChinese) {
                                const regex = new RegExp(`(${subTerm.trim()})`, 'gi');
                                console.log('中文匹配模式:', regex);  // 添加日志
                                const matches = lang1.match(regex);
                                console.log('中文匹配结果:', matches);  // 添加日志
                                lang1 = lang1.replace(regex, '<span class="alisqp">$1</span>');
                            } else {
                                const normalizedTerm = normalizeQuotes(subTerm.trim());
                                console.log('标准化后的搜索词:', normalizedTerm);  // 添加日志

                                if (normalizedTerm.includes('.*')) {
                                    const pattern = normalizedTerm.replace(/\.\*/g, '[a-zàáâãäçèéêëìíîïñòóôõöùúûüýÿæœA-ZÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝŸÆŒ]*');
                                    const regex = new RegExp(`\\b(${pattern})(?=[\\s,.!?;:]|$)`, 'gi');
                                    console.log('通配符匹配模式:', regex);  // 添加日志
                                    const matches = lang0.match(regex);
                                    console.log('通配符匹配结果:', matches);  // 添加日志
                                    if (matches) {
                                        matches.forEach(match => {
                                            console.log('正在高亮:', match);  // 添加日志
                                            lang0 = lang0.replace(match, `<span class="alisqp">${match}</span>`);
                                        });
                                    }
                                } else {
                                    // 创建一个包含所有可能引号的模式
                                    const quoteParts = normalizedTerm.split("'");
                                    if (quoteParts.length === 2) {
                                        // 如果词中包含引号，创建匹配所有可能引号的模式
                                        const pattern = `\\b${quoteParts[0]}['’‘′‵՚＇｀]${quoteParts[1]}\\b`;
                                        const regex = new RegExp(pattern, 'gi');
                                        // 先找到所有匹配项
                                        const matches = lang0.match(regex);
                                        if (matches) {
                                            // 对每个匹配项进行高亮处理
                                            matches.forEach(match => {
                                                lang0 = lang0.replace(match, `<span class="alisqp">${match}</span>`);
                                            });
                                        }
                                    } else {
                                        // 没有引号的普通词
                                        const regex = new RegExp(`\\b(${normalizedTerm})\\b`, 'gi');
                                        lang0 = lang0.replace(regex, '<span class="alisqp">$1</span>');
                                    }
                                }
                            }
                        }
                    });
                });
            }

            // 添加负向搜索词高亮
            if (searchTerms.neg0 || searchTerms.neg1) {
                const negTerms = [];
                if (searchTerms.neg0) {
                    negTerms.push(...searchTerms.neg0.split(/\s+/).filter(term => term));
                }
                if (searchTerms.neg1) {
                    negTerms.push(...searchTerms.neg1.split(/\s+/).filter(term => term));
                }
                negTerms.forEach(term => {
                    const subTerms = term.split('|');
                    subTerms.forEach(subTerm => {
                        if (subTerm.trim()) {
                            const isChinese = /[\u4e00-\u9fa5]/.test(subTerm);
                            if (isChinese) {
                                const regex = new RegExp(`(${subTerm.trim()})`, 'gi');
                                lang1 = lang1.replace(regex, '<span class="alisqn">$1</span>');
                            } else {
                                const normalizedTerm = normalizeQuotes(subTerm.trim());

                                if (normalizedTerm.includes('.*')) {
                                    const pattern = normalizedTerm.replace(/\.\*/g, '[a-zA-Z]*?');
                                    const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');
                                    lang0 = lang0.replace(regex, '<span class="alisqn">$1</span>');
                                } else {
                                    const quoteParts = normalizedTerm.split("'");
                                    if (quoteParts.length === 2) {
                                        const pattern = `\\b${quoteParts[0]}['''′‵՚＇｀]${quoteParts[1]}\\b`;
                                        const regex = new RegExp(pattern, 'gi');
                                        const matches = lang0.match(regex);
                                        if (matches) {
                                            matches.forEach(match => {
                                                lang0 = lang0.replace(match, `<span class="alisqn">${match}</span>`);
                                            });
                                        }
                                    } else {
                                        const regex = new RegExp(`\\b(${normalizedTerm})\\b`, 'gi');
                                        lang0 = lang0.replace(regex, '<span class="alisqn">$1</span>');
                                    }
                                }
                            }
                        }
                    });
                });
            }

            // 检查内容是否为空或只包含标记
            const isEmptyOrMeta = (text) => {
                if (!text) return true;
                // 检查是否只包含类似 <Preface=F2> 的标记
                const metaPattern = /^<[^>]+>$/;
                return metaPattern.test(text.trim());
            };

            // 更新显示前检查内容
            $('#popup-id').text(id);
            $('#popupLang0').html(
                isEmptyOrMeta(lang0)
                    ? '<em class="text-muted">（无原文，此处为译者注）</em>'
                    : lang0
            );
            $('#popupLang1').html(
                isEmptyOrMeta(lang1)
                    ? '<em class="text-muted">（无译文）</em>'
                    : lang1
            );

            // 显示popup
            $popup.css({
                visibility: 'visible',
                transform: 'translate(-50%, -50%)'
            });

            if (k === 1) {
                e.stopPropagation();
                $popup.addClass('popup-fixed');
            }
        }
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Error:', error);
        }
    } finally {
        $log.removeClass('ajax-loading');
        const index = window.ajalist.indexOf(controller);
        if (index > -1) {
            window.ajalist.splice(index, 1);
        }
    }
};

// 隐藏对齐文本
window.hideAlign = window.hideAlign || function (e) {
    try {
        window.ajalist.forEach(controller => {
            if (!controller.signal.aborted) {
                controller.abort();
            }
        });
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Error:', error);
        }
    }

    window.ajalist = [];

    if (window.keep === 0) {
        const $popup = $('#popup');
        $popup.css('visibility', 'hidden')
            .removeClass('popup-fixed');
    }
};

// 搜索功能
async function search(form) {
    const $results = $('#results');
    $results.empty().addClass('loading');

    // 获取搜索条件
    const formData = new FormData(form);
    const searchData = {
        table_name: $('#table-select').val(),
        pos0: formData.get('pos0') || '',
        neg0: formData.get('neg0') || '',
        pos1: formData.get('pos1') || '',
        neg1: formData.get('neg1') || ''
    };

    // 检查是否有任何搜索条件
    if (!searchData.pos0 && !searchData.neg0 && !searchData.pos1 && !searchData.neg1) {
        $results.removeClass('loading')
            .html('<div class="alert alert-warning">请输入要检索的单词</div>');
        return;
    }

    try {
        const response = await fetch('/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(searchData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Search response:', data); // 调试日志

        if (data.items && data.items.length > 0) {
            // 统计不同类型的匹配数量
            const stats = {
                total_matches: data.items.filter(item =>
                    item.match_type?.includes('both') && !item.match_type?.includes('negative_left') && !item.match_type?.includes('negative_right')
                ).length,
                left_matches: data.items.filter(item =>
                    (item.match_type?.includes('left') || item.match_type?.includes('both')) &&
                    !item.match_type?.includes('negative_left')
                ).length,
                right_matches: data.items.filter(item =>
                    (item.match_type?.includes('right') || item.match_type?.includes('both')) &&
                    !item.match_type?.includes('negative_right')
                ).length,
                positive_matches: data.items.filter(item => {
                    if (searchData.pos0 && searchData.pos1) {
                        // 如果 neg0 和 neg1 都存在，使用 AND 逻辑
                        return item.match_type?.includes('left') && 
                               item.match_type?.includes('right');
                    } else if (searchData.pos0 && !searchData.pos1) {
                        // 如果只有其中一个存在，使用 OR 逻辑
                        return item.match_type?.includes('left') || 
                               item.match_type?.includes('both');
                    } else if (!searchData.pos0 && searchData.pos1) {
                        return item.match_type?.includes('right') || 
                               item.match_type?.includes('both');
                    }
                }).length,
                negative_matches: data.items.filter(item => {
                    if (searchData.neg0 && searchData.neg1) {
                        // 如果 neg0 和 neg1 都存在，使用 AND 逻辑
                        return item.match_type?.includes('negative_left') && 
                               item.match_type?.includes('negative_right');
                    } else {
                        // 如果只有其中一个存在，使用 OR 逻辑
                        return item.match_type?.includes('negative_left') || 
                               item.match_type?.includes('negative_right');
                    }
                }).length
            };
            // 更新统计信息显示
            let statsHtml = `
                <div class="stats-container mb-3">
                    <div class="row g-2">
                        <div class="col">
                            <div class="p-2 border rounded text-center" style="background-color: #808080; color: white;">
                                <div class="small">总方块数</div>
                                <div class="h5 mb-0">${data.total_blocks}</div>
                            </div>
                        </div>
                        <div class="col">
                            <div class="p-2 border rounded text-center" style="background-color: #9370DB; color: white;">
                                <div class="small">两边匹配</div>
                                <div class="h5 mb-0">${stats.total_matches}</div>
                            </div>
                        </div>
                        <div class="col">
                            <div class="p-2 border rounded text-center" style="background-color: #FF6B6B; color: white;">
                                <div class="small">左侧匹配</div>
                                <div class="h5 mb-0">${stats.left_matches}</div>
                            </div>
                        </div>
                        <div class="col">
                            <div class="p-2 border rounded text-center" style="background-color: #4169E1; color: white;">
                                <div class="small">右侧匹配</div>
                                <div class="h5 mb-0">${stats.right_matches}</div>
                            </div>
                        </div>
                        <div class="col">
                            <div class="p-2 border rounded text-center">
                                <div class="small text-muted">正向匹配</div>
                                <div class="h5 mb-0">${stats.positive_matches}</div>
                            </div>
                        </div>
                        <div class="col">
                            <div class="p-2 border rounded text-center">
                                <div class="small text-muted">负向匹配</div>
                                <div class="h5 mb-0">${stats.negative_matches}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            $results.html(statsHtml);

            // 创建网格容器
            const $grid = $('<div>', { class: 'alisq-grid' });
            $results.append($grid);

            // 创建表格
            const $table = $('<table>', {
                style: 'width:100%; empty-cells:show;',
                cellpadding: '1',
                cellspacing: '3'
            });

            // 初始化第一行
            let currentRow = $('<tr>');
            let leftCell = $('<td>', {
                style: 'border:3px solid grey; width:50%; vertical-align:top;',
                class: 'lang0-cell'
            });
            let rightCell = $('<td>', {
                style: 'border:3px solid grey; width:50%; vertical-align:top;',
                class: 'lang1-cell'
            });

            // 创建方块的函数
            function createBlock(i, matchedItem, isLeftSide) {
                const $block = $('<div>', {
                    class: 'alisq',
                    'data-id': i
                });

                if (matchedItem?.match_type?.length > 0) {
                    const types = matchedItem.match_type;

                    // 根据方块位置和匹配类型来决定颜色
                    if (types.includes('both')) {
                        // 两边都匹配时，两边都显示紫色
                        $block.addClass('alisqm');
                    } else if (isLeftSide) {
                        // 左侧方块
                        if (types.includes('left') && !types.includes('negative_left')) {
                            $block.addClass('alisqr');
                        } else if (!searchData.pos0 && !searchData.neg0) {
                            $block.addClass('alisqg');  // 未搜索时显示灰色
                        } else {
                            $block.addClass('alisqg');  // 不匹配时显示灰色
                        }
                    } else {
                        // 右侧方块
                        if (types.includes('right') && !types.includes('negative_right')) {
                            $block.addClass('alisqb');
                        } else if (!searchData.pos1 && !searchData.neg1) {
                            $block.addClass('alisqg');  // 未搜索时显示灰色
                        } else {
                            $block.addClass('alisqg');  // 不匹配时显示灰色
                        }
                    }
                } else {
                    $block.addClass('alisqg');  // 没有匹配时显示灰色
                }

                // 添加点击事件
                $block.on('click', (e) => window.showAlign(e, i, 1));

                return $block;
            }

            // 添加所有方块
            for (let i = 1; i <= data.total_blocks; i++) {
                const matchedItem = data.items.find(item => item.id === i);

                // 创建左右两侧的方块，传入位置参数
                const leftBlock = createBlock(i, matchedItem, true);   // 左侧方块
                const rightBlock = createBlock(i, matchedItem, false); // 右侧方块

                // 添加到对应单元格
                leftCell.append(leftBlock);
                rightCell.append(rightBlock);

                // 每个卷的结尾处添加新行
                if (volumes.includes(i)) {
                    currentRow.append(leftCell, rightCell);
                    $table.append(currentRow);

                    // 创建新的一行
                    currentRow = $('<tr>');
                    leftCell = $('<td>', {
                        style: 'border:3px solid grey; width:50%; vertical-align:top;',
                        class: 'lang0-cell'
                    });
                    rightCell = $('<td>', {
                        style: 'border:3px solid grey; width:50%; vertical-align:top;',
                        class: 'lang1-cell'
                    });
                }
            }

            // 添加最后一行（如果还有未添加的单元格）
            if (!$table.find('tr').last().is(currentRow)) {
                currentRow.append(leftCell, rightCell);
                $table.append(currentRow);
            }

            $grid.append($table);

            // 获取每页显示的单元卷数量
            let VOLUMES_PER_PAGE = parseInt($('.volumes-per-page').val(), 10);
            const rows = $table.find('tr');
            let currentPage = 0;

            // 修改显示当前页函数
            function showPage(page) {
                const rows = $table.find('tr');
                const VOLUMES_PER_PAGE = parseInt($('.volumes-per-page').val(), 10);
                const totalPages = Math.ceil(rows.length / VOLUMES_PER_PAGE);

                // 先隐藏所有行
                rows.hide();

                // 计算当前页应该显示的行的范围
                const start = page * VOLUMES_PER_PAGE;
                const end = Math.min(start + VOLUMES_PER_PAGE, rows.length);

                // 显示当前页的行
                for (let i = start; i < end; i++) {
                    rows.eq(i).show();
                }

                // 更新所有分页控件的状态
                $('.pagination-controls').each(function () {
                    const $controls = $(this);
                    const $prevButton = $controls.find('.btn:first');
                    const $nextButton = $controls.find('.btn:last');
                    const $pageInfo = $controls.find('span');

                    $prevButton.prop('disabled', page === 0);
                    $nextButton.prop('disabled', page >= totalPages - 1);
                    $pageInfo.text(`第 ${page + 1} 页，共 ${totalPages} 页`);
                });
            }

            // 绑定分页事件
            function bindPaginationEvents($controls) {
                const $prevButton = $controls.find('.btn:first');
                const $nextButton = $controls.find('.btn:last');

                $prevButton.on('click', function () {
                    if (currentPage > 0) {
                        currentPage--;
                        showPage(currentPage);
                    }
                });

                $nextButton.on('click', function () {
                    const rows = $table.find('tr');
                    const VOLUMES_PER_PAGE = parseInt($('.volumes-per-page').val(), 10);
                    const maxPage = Math.ceil(rows.length / VOLUMES_PER_PAGE) - 1;
                    if (currentPage < maxPage) {
                        currentPage++;
                        showPage(currentPage);
                    }
                });
            }

            // 绑定每页显示数量变化事件
            function bindVolumeChangeEvent() {
                $(document).on('change', '.volumes-per-page', function () {
                    const newVolumesPerPage = parseInt($(this).val(), 10);

                    // 更新所有分页控件的选择
                    $('.volumes-per-page').val(newVolumesPerPage);

                    // 重新计算并显示页面
                    currentPage = 0;
                    showPage(currentPage);
                });
            }

            // 创建分页控件的函数
            function createPaginationControls(currentVolumesPerPage) {
                const controlsHtml = `
                    <div class="row align-items-center my-3">
                        <div class="col-md-3">
                            <label class="form-label me-2">每页显示卷数：</label>
                            <select class="volumes-per-page form-select form-select-sm d-inline-block w-auto">
                                <option value="2">2</option>
                                <option value="4">4</option>
                                <option value="6">6</option>
                                <option value="8">8</option>
                                <option value="10">10</option>
                            </select>
                        </div>
                        <div class="col-md-9">
                            <div class="pagination-controls d-flex justify-content-end align-items-center">
                                <button class="btn btn-sm btn-outline-primary me-2"><<< 上一页</button>
                                <span class="mx-3">第 1 页，共 1 页</span>
                                <button class="btn btn-sm btn-outline-primary ms-2">下一页 >>></button>
                            </div>
                        </div>
                    </div>
                `;

                const $controls = $(controlsHtml);
                $controls.find('.volumes-per-page').val(currentVolumesPerPage);
                return $controls;
            }

            // 在搜索函数中添加分页控件
            const currentVolumesPerPage = parseInt($('.volumes-per-page').val(), 10) || 4; // 默认值为4
            const $topPagination = createPaginationControls(currentVolumesPerPage);
            const $bottomPagination = createPaginationControls(currentVolumesPerPage);

            // 添加到页面并绑定事件
            $results.prepend($topPagination);
            $results.append($bottomPagination);
            bindPaginationEvents($topPagination);
            bindPaginationEvents($bottomPagination);
            bindVolumeChangeEvent();
        } else {
            $results.html('<div class="alert alert-info">没有找到匹配的结果</div>');
        }
    } catch (error) {
        console.error('Search error:', error);
        $results.html('<div class="alert alert-danger">搜索出错，请重试</div>');
    } finally {
        $results.removeClass('loading');
    }
}

function getMatchClass(item) {
    if (!item || !item.match_type || item.match_type.length === 0) {
        return 'alisqg';  // 灰色：不包搜索词
    }

    const types = item.match_type;

    // 确保类型判断的优先级正确
    if (types.includes('both')) {
        return 'alisqm';  // 紫色：同时包含法语和中文
    }
    if (types.includes('left') && !types.includes('right')) {
        return 'alisqr';  // 红色：仅包含法语
    }
    if (types.includes('right') && !types.includes('left')) {
        return 'alisqb';  // 蓝色：仅包含中文
    }

    return 'alisqg';  // 默认灰色
}
// 加载表格列表
async function loadTables() {
    try {
        const response = await fetch('/tables');
        const data = await response.json();
        const $select = $('#table-select');

        $select.empty();
        data.tables.forEach(table => {
            $select.append($('<option>', {
                value: table,
                text: table
            }));
        });
    } catch (error) {
        console.error('Failed to load tables:', error);
    }
}

// 展开/收起功能
function ouvre(n, h) {
    const $row = $(`#idRow${n}`);
    if ($row.is(':hidden')) {
        $row.slideDown().css('height', h + 'px');
    } else {
        $row.slideUp();
    }
}

function dessus(n) {
    $(`#name${n}`).css('backgroundColor', '#eee');
}

function parti(n) {
    $(`#name${n}`).css('backgroundColor', '');
}

// 初始化
$(document).ready(function () {
    // 加载表格
    loadTables();
    // 初始化所有tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    // 上传话框控制
    const $uploadDialog = $('#upload-dialog');

    $('#show-upload-btn').on('click', function () {
        $uploadDialog.modal('show');
    });

    // 表单提交
    $('#upload-form').on('submit', async function (e) {
        e.preventDefault();
        try {
            const formData = new FormData(this);
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                alert('上传成功！');
                $uploadDialog.modal('hide');
                loadTables();
            } else {
                alert(data.error || '上传失败');
            }
        } catch (error) {
            alert('上传出错：' + error.message);
        }
    });

    // 表格选择变化
    $('#table-select').on('change', function () {
        window.alibuf = new Array(7058);
        const $searchForm = $('#search-form');
        if ($searchForm.length) {
            search($searchForm[0]);
        }
    });

    // 搜索表单提交
    $('#search-form').on('submit', function (e) {
        e.preventDefault();
        search(this);
    });

    // 文档点击事件
    $(document).on('click', function (e) {
        const $target = $(e.target);
        if (!$target.closest('#popupLang0, #popupLang1, #t, #c, .alisq').length) {
            window.keep = 0;
            window.hideAlign(e);
        }
    });
});

