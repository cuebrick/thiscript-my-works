$(function () {
	works.load('json/works.json');
});
var works = {
	_props_ : {
		padding: 80,
		gap: 10,
		itemWidth: 200,
		itemHeight: 60,
		animationDelay: 80,
		animationDuration: 600,
		openedItemId: null
	},
	items : {},
	selectedItems: {},
	unselectedItems: {},

	// z-index 제어용으로만 사용.
	itemStackOrder : [],

	load: function (url) {
		$.getJSON(url, function (data) {
			works.createItems(data);
			works.initInteract('.item');
			works.addListener('.item');
			works.startInItem();
			$(window).trigger('resize');
		});
	},

	/**
	 * 임시 바인딩 코드.
	 * @param data
	 */
	createItems: function (data) {
		var itemData, $item, tags, thumb, id, item;
		for(var i = 0; i < data.length; ++i){
			itemData = data[i];
			if(itemData.active === false)
				continue;

			tags = $('<div class="tags"></div>');
			$.each(itemData.tags, function (index, value) {
				tags.append($('<span></span>').text(value))
			});
			thumb = (itemData.path && itemData.thumb) ? $('<img/>').attr('src', itemData.path + itemData.thumb) : null;

			id = "item" + i;
			$item = $('<div class="item"></div>')
				.append($('<div class="thumb"></div>').append(thumb))
				.append($('<h3></h3>').text(itemData.title))
				.append(tags)
				.attr('id', id)
				.appendTo($('#stage'));

			item = works.getItemObject();
			item.id = id;
			item.element = $item.get(0);
			item.data = itemData;
			works.items[id] = item;
			works.itemStackOrder.push(item.element);
		}
	},

	initInteract: function (selector) {
		// this is used later in the resizing and gesture demos
		window.dragMoveListener = works.itemDragMoveListener;
		// target elements with the "draggable" class
		interact(selector)
			.draggable({
				// enable inertial throwing
				inertia: true,
				// keep the element within the area of it's parent
				restrict: {
					restriction: "parent",
					endOnly: true,
					elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
				},
				// enable autoScroll
				autoScroll: true,
				onstart: works.itemDragStartHandler,
				onmove: works.itemDragMoveListener,
				onend: works.itemDragEndHandler
			}).styleCursor(false);
	},
	getItemObject: function () {
		return {
			id: null,
			element : null,
			data : null,
			x: 0,
			y: 0,
			delay: null
		}
	},

	addListener: function (selector) {
		$(window).resize(function () {
			if(works._props_.resizeTimer){
				clearInterval(works._props_.resizeTimer);
			}
			works._props_.resizeTimer = setTimeout(onWindowResize, 1000);
		}).keyup(function (e) {
			works.keyboardCommand(e.keyCode);
		});

		function onWindowResize() {
			if(Object.keys(works.selectedItems).length){
				works.alignSelectedItems(works.selectedItems);
				works.alignUnselectedItems(works.unselectedItems);
			}else{
				works.alignSelectedItems(works.items);
			}
		}

		$(selector)
			.mouseenter(works.itemMouseEnterHandler)
			.click(works.itemClickHandler)
			.find('.tags > span')
			.click(function (e) {
				e.stopImmediatePropagation();
				if($(this).hasClass('on'))
					works.deselectTag();
				else
					works.selectByTag($(this).text());
			});

		$('.descriptions .close-button').click(works.closeDescription)
	},

	selectByTag: function (tagName) {
		works.selectedItems = {};
		works.unselectedItems = {};

		for(var id in works.items){
			var item = works.items[id];
			var bool;
			$.each(item.data.tags, function (idx, tag) {
				bool = (tag === tagName);
				if(bool) return false;
			});

			if(bool){
				works.selectedItems[item.id] = item;
			}else{
				works.unselectedItems[item.id] = item;
			}
		}

		$('.item .tags > span').each(function () {
			$(this).toggleClass('on', $(this).text() === tagName)
		});
		works.alignSelectedItems(works.selectedItems);
		works.alignUnselectedItems(works.unselectedItems);
	},

	deselectTag: function () {
		works.selectedItems = {};
		works.unselectedItems = {};
		$('.item .tags > span.on').each(function () {
			$(this).removeClass('on');
		});
		works.alignSelectedItems(works.items);
	},

	alignSelectedItems: function (selectedItems) {
		var padding = works._props_.padding;
		var gap = works._props_.gap;
		var w = works._props_.itemWidth;
		var h = works._props_.itemHeight;
		// 몇개가 들어갈 수 있나 계산
		var n = Math.floor((window.innerWidth - gap) / (w + gap));
		var offsetX = Math.floor((window.innerWidth - (w + gap) * n) / 2) + Math.floor(gap / 2);

		var count = 0,
			col,
			row,
			x,
			y;
		for(var id in selectedItems){
			var item = selectedItems[id];
			col = count % n;
			row = Math.floor(count / n);
			x = ((w + gap) * col) + offsetX;
			y = (h + gap) * row + padding;
			works.animateItem(item, x, y, works._props_.animationDuration, works._props_.animationDelay * count);
			++count;
		}
	},

	alignUnselectedItems: function (unselectedItems) {

		var count = 0,
			x,
			y,
			w = window.innerWidth,
			h = window.innerHeight;
		for(var id in unselectedItems){
			var item = unselectedItems[id];
			x = util.getRandomRange(0, w - works._props_.itemWidth);
			y = util.getRandomRange(h - 140, h - works._props_.itemHeight);
			works.animateItem(item, x, y, works._props_.animationDuration, works._props_.animationDelay * count);
			++count;
		}
	},

	/**
	 * Reorder item z-index.
	 */
	itemMouseEnterHandler: function () {
		var index = works.itemStackOrder.indexOf(this);
		var topItem = works.itemStackOrder.splice(index, 1)[0];
		if(!topItem)
			return;

		works.itemStackOrder.push(topItem);
		$.each(works.itemStackOrder, function (index, item) {
			$(item).css('z-index', index);
		});
	},
	/**
	 * Unbind click event handler
	 * @param e
	 */
	itemDragStartHandler: function (e) {
		$(e.target).unbind('click', works.itemClickHandler);
	},
	/**
	 * Dragging Item
	 * @param e
	 */
	itemDragMoveListener : function (e) {
		var target = e.target;
		var id = $(target).attr('id');
		var item = works.items[id];

		item.x = (item.x || 0) + e.dx;
		item.y = (item.y || 0) + e.dy;
		works.moveItem(item);
	},
	/**
	 * Bind click event handler
	 * @param e
	 */
	itemDragEndHandler : function (e) {
		setTimeout(function () {
			$(e.target).bind('click', works.itemClickHandler);
		}, 0)
	},
	/**
	 * Item click to open description layer
	 * @param e
	 */
	itemClickHandler : function (e) {
		var id = $(e.currentTarget).attr('id');
		works.openDescription(id);
	},

	/**
	 * Open to description div
	 * @param id
	 */
	openDescription: function (id) {
		var offset = $('#'+id).offset();
		works._props_.openedItemId = id;
		works.setDescription(works.items[id].data);
		$('.zoom-window')
			.css(offset)
			.css('display', 'block')
			.animate({
				'left': 0,
				'top': 0,
				'width': '100%',
				'height': '100%',
				'background-color': 'rgba(0, 0, 0, 0.96);'
			}, 250, 'linear', function () {
				$('.descriptions').fadeIn(200);
			});
	},

	/**
	 * Bind data to description div
	 * @param data
	 */
	setDescription: function (data) {
		console.log(data);
		$('.descriptions h2')
			.text(data.title)
			.css('background-image', 'url('+ data.path + data.thumb + ')');

		var tags = $('.descriptions .tags').text('');
		$.each(data.tags, function (index, value) {
			tags.append($('<span></span>').text(value));
		});
		$('.descriptions .term').text(data.begin + ' ~ ' + data.finish);
		$('.descriptions .client > a').text(data.client.name).attr('href', data.client.website);

		$('.descriptions > .detail > .text').text(data.description);

		var urls = $('.descriptions > .detail > .urls').text('');
		$.each(data.urls, function (index, value) {
			urls.append($('<a target="_blank"></a>').text(value.title).attr('href', value.url));
		});

		var imageTile = $('.descriptions > .detail > .image-tile').text('');
		$.each(data.images, function (index, value) {
			imageTile
				.append($('<figure></figure>')
					.append($('<img/>').attr('src', data.path + value.url))
					.append($('<figcaption></figcaption>').text(value.caption)));
		})
	},

	/**
	 * Close description div
	 */
	closeDescription: function () {
		var offset = $('#'+works._props_.openedItemId).offset();
		$('.descriptions').fadeOut(100);
		$('.zoom-window')
			.animate({
				'left': offset.left,
				'top': offset.top,
				'width': works._props_.itemWidth,
				'height': works._props_.itemHeight
			}, 200, 'linear', function () {
				$(this).hide();
			});
	},

	/**
	 * Window keyboard handler
	 * @param keyCode
	 */
	keyboardCommand: function (keyCode) {
		console.log(keyCode);
		switch (keyCode){
			case 27:// ESC key
				works.closeDescription();
				break;
			default:
				console.log('Do not keyboard action');
		}
	},

	/**
	 * Move item one frame
	 * @param item
	 */
	moveItem: function (item) {
		// translate the element
		// item.element.style.webkitTransform = item.element.style.transform = 'translate(' + item.x + 'px, ' + item.y + 'px)';
		$(item.element).css({left: item.x + 'px', top: item.y + 'px'});
	},

	/**
	 * Item first start
	 */
	startInItem: function () {
		var x = Math.round(window.innerWidth / 2) - (works._props_.itemWidth / 2);
		var y = window.innerHeight - 100;
		for(var id in works.items) {
			var item = works.items[id];
			item.x = x;
			item.y = y;
			works.moveItem(item);
		}
	},

	/**
	 * Item animate to position
	 * @param item
	 * @param x
	 * @param y
	 * @param duration
	 * @param delay
	 */
	animateItem: function (item, x, y, duration, delay) {
		// console.log($(item.element), x, y);
		$(item.element).dequeue().delay(delay).animate({
			'left': x,
			'top': y
		}, {
			duration: duration,
			complete: function () {
				item.x = x;
				item.y = y;
			}
		});

		/*$(item.element).delay(delay).animate({
			targetX: x,
			targetY: y
		},{
			step: function (now, fx) {
				if(fx.prop === 'targetX'){
					item.x = now;
				}else if(fx.prop === 'targetY'){
					item.y = now;
					// $(this).css('transform', 'translate(' + tx + 'px,' + ty + 'px)');
					console.log('-----------', item.x, item.y);
					works.moveItem(item);
				}
			},
			duration:duration
		}, 'easeInOut');*/
	}
};



var util = {
	getRandomRange: function (min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
	}
};

