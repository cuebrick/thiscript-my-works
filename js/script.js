$(function () {
	works.load('json/works.json');
	works.init('.item');
	works.addListener('.item');
	works.startInItem();
	$(window).trigger('resize');
});
var works = {
	_props_ : {
		padding: 50,
		gap: 10,
		itemWidth: 200,
		itemHeight: 60
	},
	items : {},

	// z-index 제어용으로만 사용.
	itemStackOrder : [],

	load: function (url) {
		$.getJSON(url, function (data) {
			console.log(data);
		});
	},
	init: function (selector) {
		// this is used later in the resizing and gesture demos
		window.dragMoveListener = works.dragMoveListener;
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

				// call this function on every dragmove event
				onmove: works.dragMoveListener,
				// call this function on every dragend event
				onend: function (event) {

				}
			});

		$(selector).each(function (idx) {
			var item = works.getItemObject(this);
			var id = "item" + idx;
			works.items[id] = item;
			$(this).attr('data-id', id);

			works.itemStackOrder.push(this);
		});
	},
	getItemObject: function ($element) {
		return {
			element : $element,
			x: 0,
			y: 0,
			delay: null
		}
	},

	dragMoveListener : function (event) {
		var target = event.target;

		var id = $(target).attr('data-id');
		var item = works.items[id];

		item.x = (item.x || 0) + event.dx;
		item.y = (item.y || 0) + event.dy;
		works.moveItem(item);
	},

	addListener: function (selector) {
		$(window).resize(function (e) {
			if(works._props_.resizeTimer){
				clearInterval(works._props_.resizeTimer);
			}
			works._props_.resizeTimer = setTimeout(onWindowResize, 1000);
		});

		function onWindowResize(e) {
			var padding = works._props_.padding;
			var gap = works._props_.gap;
			var w = works._props_.itemWidth;
			var h = works._props_.itemHeight;
			// 몇개가 들어갈 수 있나 계산
			var n = Math.floor((window.innerWidth - (padding * 2)) / (w + gap));
			var offsetX = Math.floor((window.innerWidth - (padding * 2) - (w + gap) * n) / 2);
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
				x = ((w + gap) * col) + padding + offsetX;
				y = (h + gap) * row + padding;
				delay = w * count;
				works.animateItem(item, x, y, 800, w * count);
				++count;
			}
		}

		$(selector).mouseenter(function () {
			var index = works.itemStackOrder.indexOf(this);
			var topItem = works.itemStackOrder.splice(index, 1)[0];
			if(!topItem)
				return;

			works.itemStackOrder.push(topItem);
			$.each(works.itemStackOrder, function (index, item) {
				$(item).css('z-index', index);
			});
		});
	},

	moveItem: function (item) {
		// translate the element
		// item.element.style.webkitTransform = item.element.style.transform = 'translate(' + item.x + 'px, ' + item.y + 'px)';
		$(item.element).css({left: item.x + 'px', top: item.y + 'px'});
	},

	startInItem: function () {
		var x = Math.round(window.innerWidth / 2) - (works._props_.itemWidth / 2);
		var y = window.innerHeight - 100;
		for(var key in works.items) {
			var item = works.items[key];
			console.log(item);
			item.x = x;
			item.y = y;
			works.moveItem(item);
		}
	},

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





