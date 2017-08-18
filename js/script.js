$(function () {
	works.load('json/works.json');
});
var works = {
	_props_ : {
		padding: 80,
		gap: 10,
		itemWidth: 200,
		itemHeight: 60,
		openedItemId: null
	},
	items : {},

	// z-index 제어용으로만 사용.
	itemStackOrder : [],

	load: function (url) {
		$.getJSON(url, function (data) {
			console.log(data);
			works.createItems(data);
			works.initInteract('.item');
			works.addListener('.item');
			works.startInItem();
			$(window).trigger('resize');
		});

	},

	createItems: function (data) {
		var itemData;
		for(var i = 0; i < data.length; ++i){
			itemData = data[i];
			var tags = $('<div class="tags"></div>');
			$.each(itemData.tags, function (index, value) {
				tags.append($('<span></span>').text(value))
			});
			var thumb = (itemData.path && itemData.thumb) ? $('<img>').attr('src', itemData.path + itemData.thumb) : null;
			$('#stage').append(
				$('<div class="item"></div>').append(
					$('<div class="thumb"></div>').append(thumb)
				).append(
					$('<h3></h3>').text(itemData.title)
				).append(tags)
			)
		}
	},

	initInteract: function (selector) {
		// this is used later in the resizing and gesture demos
		window.dragMoveListener = works.itemDragMoveListener;
		// target elements with the "draggable" class
		interact('.item')
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
	getItemObject: function ($element) {
		return {
			element : $element,
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
			var padding = works._props_.padding;
			var gap = works._props_.gap;
			var w = works._props_.itemWidth;
			var h = works._props_.itemHeight;
			// 몇개가 들어갈 수 있나 계산
			var n = Math.floor((window.innerWidth - gap) / (w + gap));
			var offsetX = Math.floor((window.innerWidth - (w + gap) * n) / 2) + Math.floor(gap / 2);
			console.log(window.innerWidth, n, gap, offsetX);

			var count = 0,
				col,
				row,
				x,
				y,
				delay;
			for(var key in works.items){
				var item = works.items[key];
				col = count % n;
				row = Math.floor(count / n);
				x = ((w + gap) * col) + offsetX;
				y = (h + gap) * row + padding;
				delay = w * count;
				works.animateItem(item, x, y, 800, w * count);
				++count;
			}
		}

		$(selector)
			.mouseenter(works.itemMouseEnterHandler)
			.click(works.itemClickHandler)
			.each(function (idx) {
				var item = works.getItemObject(this);
				var id = "item" + idx;
				works.items[id] = item;
				$(this).attr('id', id);

				works.itemStackOrder.push(this);
			});

		$('.descriptions .close-button').click(works.closeDescription)
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
		console.log(id, $('#'+id).offset());
		works.openDescription(id);
	},

	/**
	 * Open to description div
	 * @param id
	 */
	openDescription: function (id) {
		var offset = $('#'+id).offset();
		works._props_.openedItemId = id;
		works.setDescription(works.items[id]);
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
			case 27:
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
		for(var key in works.items) {
			var item = works.items[key];
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
		$(item.element).delay(delay).animate({
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





