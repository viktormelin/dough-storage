var app = (function () {
    'use strict';

    function noop$1() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop$1;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }

    const is_client = typeof window !== 'undefined';
    let now$2 = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop$1;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty$1() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.wholeText !== data)
            text.data = data;
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = append_empty_stylesheet(node).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop$1, css } = config || null_transition;
            const program = {
                start: now$2() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro ??? we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro ??? needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop$1,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop$1;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    /* src\components\sidebar\sidebarItem.svelte generated by Svelte v3.44.2 */

    function create_fragment$a(ctx) {
    	let div;
    	let i;
    	let t0;
    	let p;
    	let t1;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div = element("div");
    			i = element("i");
    			t0 = space();
    			p = element("p");
    			t1 = text(/*text*/ ctx[1]);
    			attr(i, "class", /*icon*/ ctx[2]);
    			attr(p, "class", "ml-2 text-xl");
    			attr(div, "class", "cursor-pointer my-2 flex items-center font-sans text-white uppercase align-middle transition-all duration-500 ease-in-out hover:ml-4 hover:text-gray-300");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, i);
    			append(div, t0);
    			append(div, p);
    			append(p, t1);

    			if (!mounted) {
    				dispose = listen(div, "click", function () {
    					if (is_function(/*clickHandler*/ ctx[3](`${/*id*/ ctx[0]}`))) /*clickHandler*/ ctx[3](`${/*id*/ ctx[0]}`).apply(this, arguments);
    				});

    				mounted = true;
    			}
    		},
    		p(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*icon*/ 4) {
    				attr(i, "class", /*icon*/ ctx[2]);
    			}

    			if (dirty & /*text*/ 2) set_data(t1, /*text*/ ctx[1]);
    		},
    		i: noop$1,
    		o: noop$1,
    		d(detaching) {
    			if (detaching) detach(div);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { id } = $$props;
    	let { text } = $$props;
    	let { icon } = $$props;
    	const dispatch = createEventDispatcher();

    	function clickHandler(e) {
    		dispatch("clickEvent", { menu: e });
    	}

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    		if ('text' in $$props) $$invalidate(1, text = $$props.text);
    		if ('icon' in $$props) $$invalidate(2, icon = $$props.icon);
    	};

    	return [id, text, icon, clickHandler];
    }

    class SidebarItem extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { id: 0, text: 1, icon: 2 });
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop$1) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop$1) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop$1;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const UnitData = writable([]);
    const UnitSettings = writable([]);
    const UnitLocations = writable([]);
    const RaidableUnits = writable([]);
    const LocaleSettings = writable([]);

    /* src\components\sidebar\sidebar.svelte generated by Svelte v3.44.2 */

    function create_if_block$5(ctx) {
    	let sidebaritem;
    	let current;

    	sidebaritem = new SidebarItem({
    			props: {
    				id: "raidUnits",
    				text: /*$LocaleSettings*/ ctx[5].raidUnits,
    				icon: "fas fa-hammer"
    			}
    		});

    	sidebaritem.$on("clickEvent", /*clickHandler*/ ctx[6]);

    	return {
    		c() {
    			create_component(sidebaritem.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(sidebaritem, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const sidebaritem_changes = {};
    			if (dirty & /*$LocaleSettings*/ 32) sidebaritem_changes.text = /*$LocaleSettings*/ ctx[5].raidUnits;
    			sidebaritem.$set(sidebaritem_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(sidebaritem.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(sidebaritem.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(sidebaritem, detaching);
    		}
    	};
    }

    function create_fragment$9(ctx) {
    	let div4;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div2;
    	let p0;
    	let t1_value = /*$UnitLocations*/ ctx[4][/*location*/ ctx[1]].label + "";
    	let t1;
    	let t2;
    	let div1;
    	let sidebaritem0;
    	let t3;
    	let sidebaritem1;
    	let t4;
    	let t5;
    	let div3;
    	let current;

    	sidebaritem0 = new SidebarItem({
    			props: {
    				id: "myUnits",
    				text: /*$LocaleSettings*/ ctx[5].myUnits,
    				icon: "fas fa-home"
    			}
    		});

    	sidebaritem0.$on("clickEvent", /*clickHandler*/ ctx[6]);

    	sidebaritem1 = new SidebarItem({
    			props: {
    				id: "buyUnits",
    				text: /*$LocaleSettings*/ ctx[5].buyUnits,
    				icon: "fas fa-store-alt"
    			}
    		});

    	sidebaritem1.$on("clickEvent", /*clickHandler*/ ctx[6]);
    	let if_block = /*police*/ ctx[0] && create_if_block$5(ctx);

    	return {
    		c() {
    			div4 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div2 = element("div");
    			p0 = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			div1 = element("div");
    			create_component(sidebaritem0.$$.fragment);
    			t3 = space();
    			create_component(sidebaritem1.$$.fragment);
    			t4 = space();
    			if (if_block) if_block.c();
    			t5 = space();
    			div3 = element("div");
    			div3.innerHTML = `<p class="font-sans text-white text-sm py-1">Created by .dough#0001</p>`;
    			if (!src_url_equal(img.src, img_src_value = /*communityLogo*/ ctx[3])) attr(img, "src", img_src_value);
    			attr(img, "alt", /*communityName*/ ctx[2]);
    			attr(div0, "class", "h-1/5 w-full flex flex-col items-center justify-center px-5");
    			attr(p0, "class", "font-sans text-white font-bold text-md uppercase");
    			attr(div1, "class", "px-7");
    			attr(div2, "class", "w-full text-center");
    			attr(div3, "class", "h-1/5 w-full flex items-end justify-center");
    			attr(div4, "class", "flex flex-col justify-between items-start w-1/5 h-full border-r-2 border-white ");
    		},
    		m(target, anchor) {
    			insert(target, div4, anchor);
    			append(div4, div0);
    			append(div0, img);
    			append(div4, t0);
    			append(div4, div2);
    			append(div2, p0);
    			append(p0, t1);
    			append(div2, t2);
    			append(div2, div1);
    			mount_component(sidebaritem0, div1, null);
    			append(div1, t3);
    			mount_component(sidebaritem1, div1, null);
    			append(div1, t4);
    			if (if_block) if_block.m(div1, null);
    			append(div4, t5);
    			append(div4, div3);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (!current || dirty & /*communityLogo*/ 8 && !src_url_equal(img.src, img_src_value = /*communityLogo*/ ctx[3])) {
    				attr(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*communityName*/ 4) {
    				attr(img, "alt", /*communityName*/ ctx[2]);
    			}

    			if ((!current || dirty & /*$UnitLocations, location*/ 18) && t1_value !== (t1_value = /*$UnitLocations*/ ctx[4][/*location*/ ctx[1]].label + "")) set_data(t1, t1_value);
    			const sidebaritem0_changes = {};
    			if (dirty & /*$LocaleSettings*/ 32) sidebaritem0_changes.text = /*$LocaleSettings*/ ctx[5].myUnits;
    			sidebaritem0.$set(sidebaritem0_changes);
    			const sidebaritem1_changes = {};
    			if (dirty & /*$LocaleSettings*/ 32) sidebaritem1_changes.text = /*$LocaleSettings*/ ctx[5].buyUnits;
    			sidebaritem1.$set(sidebaritem1_changes);

    			if (/*police*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*police*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(sidebaritem0.$$.fragment, local);
    			transition_in(sidebaritem1.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(sidebaritem0.$$.fragment, local);
    			transition_out(sidebaritem1.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div4);
    			destroy_component(sidebaritem0);
    			destroy_component(sidebaritem1);
    			if (if_block) if_block.d();
    		}
    	};
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $UnitLocations;
    	let $LocaleSettings;
    	component_subscribe($$self, UnitLocations, $$value => $$invalidate(4, $UnitLocations = $$value));
    	component_subscribe($$self, LocaleSettings, $$value => $$invalidate(5, $LocaleSettings = $$value));
    	let { police } = $$props;
    	let { location } = $$props;
    	let { communityName } = $$props;
    	let { communityLogo } = $$props;
    	const dispatch = createEventDispatcher();

    	function clickHandler(e) {
    		dispatch("clickEvent", { menu: e.detail.menu });
    	}

    	$$self.$$set = $$props => {
    		if ('police' in $$props) $$invalidate(0, police = $$props.police);
    		if ('location' in $$props) $$invalidate(1, location = $$props.location);
    		if ('communityName' in $$props) $$invalidate(2, communityName = $$props.communityName);
    		if ('communityLogo' in $$props) $$invalidate(3, communityLogo = $$props.communityLogo);
    	};

    	return [
    		police,
    		location,
    		communityName,
    		communityLogo,
    		$UnitLocations,
    		$LocaleSettings,
    		clickHandler
    	];
    }

    class Sidebar extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			police: 0,
    			location: 1,
    			communityName: 2,
    			communityLogo: 3
    		});
    	}
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    /* src\components\utils\modal.svelte generated by Svelte v3.44.2 */

    function create_fragment$8(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let i;
    	let t0;
    	let h3;
    	let t1_value = /*$LocaleSettings*/ ctx[1].confirmationText + "";
    	let t1;
    	let t2;
    	let p;
    	let t3_value = `${/*text*/ ctx[0]}` + "";
    	let t3;
    	let t4;
    	let div1;
    	let button0;
    	let t5_value = /*$LocaleSettings*/ ctx[1].confirmOption + "";
    	let t5;
    	let t6;
    	let button1;
    	let t7_value = /*$LocaleSettings*/ ctx[1].cancelOption + "";
    	let t7;
    	let div3_transition;
    	let current;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			i = element("i");
    			t0 = space();
    			h3 = element("h3");
    			t1 = text(t1_value);
    			t2 = space();
    			p = element("p");
    			t3 = text(t3_value);
    			t4 = space();
    			div1 = element("div");
    			button0 = element("button");
    			t5 = text(t5_value);
    			t6 = space();
    			button1 = element("button");
    			t7 = text(t7_value);
    			attr(i, "class", "fas fa-exclamation-triangle mr-2 text-blue-600");
    			attr(h3, "class", "font-bold text-lg");
    			attr(div0, "class", "flex flex-row items-center");
    			attr(button0, "class", "py-1 px-4 mt-5 bg-gray-700 border-0 rounded font-sans uppercase transition-all duration-300 ease-in-out hover:shadow-lg hover:bg-green-800");
    			attr(button1, "class", "py-1 px-4 mt-5 bg-gray-700 border-0 rounded font-sans uppercase transition-all duration-300 ease-in-out hover:shadow-lg hover:bg-red-800");
    			attr(div1, "class", "flex justify-around");
    			attr(div2, "class", "bg-gray-900 px-10 py-5 uppercase text-white shadow-md rounded-md");
    			attr(div3, "class", "fixed w-screen h-screen flex justify-center items-center top-0 left-0 bg-gray-700/75");
    		},
    		m(target, anchor) {
    			insert(target, div3, anchor);
    			append(div3, div2);
    			append(div2, div0);
    			append(div0, i);
    			append(div0, t0);
    			append(div0, h3);
    			append(h3, t1);
    			append(div2, t2);
    			append(div2, p);
    			append(p, t3);
    			append(div2, t4);
    			append(div2, div1);
    			append(div1, button0);
    			append(button0, t5);
    			append(div1, t6);
    			append(div1, button1);
    			append(button1, t7);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(button0, "click", /*click_handler*/ ctx[3]),
    					listen(button1, "click", /*click_handler_1*/ ctx[4])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if ((!current || dirty & /*$LocaleSettings*/ 2) && t1_value !== (t1_value = /*$LocaleSettings*/ ctx[1].confirmationText + "")) set_data(t1, t1_value);
    			if ((!current || dirty & /*text*/ 1) && t3_value !== (t3_value = `${/*text*/ ctx[0]}` + "")) set_data(t3, t3_value);
    			if ((!current || dirty & /*$LocaleSettings*/ 2) && t5_value !== (t5_value = /*$LocaleSettings*/ ctx[1].confirmOption + "")) set_data(t5, t5_value);
    			if ((!current || dirty & /*$LocaleSettings*/ 2) && t7_value !== (t7_value = /*$LocaleSettings*/ ctx[1].cancelOption + "")) set_data(t7, t7_value);
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div3_transition) div3_transition = create_bidirectional_transition(div3, fade, {}, true);
    				div3_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div3_transition) div3_transition = create_bidirectional_transition(div3, fade, {}, false);
    			div3_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div3);
    			if (detaching && div3_transition) div3_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $LocaleSettings;
    	component_subscribe($$self, LocaleSettings, $$value => $$invalidate(1, $LocaleSettings = $$value));
    	let { text } = $$props;
    	const dispatch = createEventDispatcher();

    	function modalHandler(e) {
    		dispatch("modalEvent", { option: e });
    	}

    	const click_handler = () => modalHandler("confirm");
    	const click_handler_1 = () => modalHandler("cancel");

    	$$self.$$set = $$props => {
    		if ('text' in $$props) $$invalidate(0, text = $$props.text);
    	};

    	return [text, $LocaleSettings, modalHandler, click_handler, click_handler_1];
    }

    class Modal extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { text: 0 });
    	}
    }

    /* src\components\utils\myUnitCard.svelte generated by Svelte v3.44.2 */

    function create_if_block_2$2(ctx) {
    	let modal;
    	let current;

    	modal = new Modal({
    			props: {
    				text: /*$LocaleSettings*/ ctx[4].cancelConfirmation
    			}
    		});

    	modal.$on("modalEvent", /*confirmAction*/ ctx[8]);

    	return {
    		c() {
    			create_component(modal.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const modal_changes = {};
    			if (dirty & /*$LocaleSettings*/ 16) modal_changes.text = /*$LocaleSettings*/ ctx[4].cancelConfirmation;
    			modal.$set(modal_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};
    }

    // (66:3) {:else}
    function create_else_block_1(ctx) {
    	let t0_value = /*$LocaleSettings*/ ctx[4].sellPrice + "";
    	let t0;
    	let t1;
    	let t2_value = /*unitPrice*/ ctx[3] * (1 - /*sellDecrease*/ ctx[1] / 100) + "";
    	let t2;

    	return {
    		c() {
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    		},
    		m(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, t1, anchor);
    			insert(target, t2, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*$LocaleSettings*/ 16 && t0_value !== (t0_value = /*$LocaleSettings*/ ctx[4].sellPrice + "")) set_data(t0, t0_value);
    			if (dirty & /*unitPrice, sellDecrease*/ 10 && t2_value !== (t2_value = /*unitPrice*/ ctx[3] * (1 - /*sellDecrease*/ ctx[1] / 100) + "")) set_data(t2, t2_value);
    		},
    		d(detaching) {
    			if (detaching) detach(t0);
    			if (detaching) detach(t1);
    			if (detaching) detach(t2);
    		}
    	};
    }

    // (64:3) {#if unitData.rented}
    function create_if_block_1$3(ctx) {
    	let t0_value = /*$LocaleSettings*/ ctx[4].rentPrice + "";
    	let t0;
    	let t1;
    	let t2;

    	return {
    		c() {
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(/*unitPrice*/ ctx[3]);
    		},
    		m(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, t1, anchor);
    			insert(target, t2, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*$LocaleSettings*/ 16 && t0_value !== (t0_value = /*$LocaleSettings*/ ctx[4].rentPrice + "")) set_data(t0, t0_value);
    			if (dirty & /*unitPrice*/ 8) set_data(t2, /*unitPrice*/ ctx[3]);
    		},
    		d(detaching) {
    			if (detaching) detach(t0);
    			if (detaching) detach(t1);
    			if (detaching) detach(t2);
    		}
    	};
    }

    // (80:3) {:else}
    function create_else_block$1(ctx) {
    	let t_value = /*$LocaleSettings*/ ctx[4].sellUnit + "";
    	let t;

    	return {
    		c() {
    			t = text(t_value);
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*$LocaleSettings*/ 16 && t_value !== (t_value = /*$LocaleSettings*/ ctx[4].sellUnit + "")) set_data(t, t_value);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (78:3) {#if unitData.rented}
    function create_if_block$4(ctx) {
    	let t_value = /*$LocaleSettings*/ ctx[4].cancelRent + "";
    	let t;

    	return {
    		c() {
    			t = text(t_value);
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*$LocaleSettings*/ 16 && t_value !== (t_value = /*$LocaleSettings*/ ctx[4].cancelRent + "")) set_data(t, t_value);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    function create_fragment$7(ctx) {
    	let t0;
    	let div1;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t1;
    	let div0;
    	let p0;
    	let t2_value = /*$UnitSettings*/ ctx[5][/*unitData*/ ctx[0].type].label + "";
    	let t2;
    	let t3;
    	let t4_value = /*unitData*/ ctx[0].id + "";
    	let t4;
    	let t5;
    	let t6;
    	let p1;
    	let t7_value = /*$LocaleSettings*/ ctx[4].totalWeight + "";
    	let t7;
    	let t8;
    	let t9_value = /*$UnitSettings*/ ctx[5][/*unitData*/ ctx[0].type].size + "";
    	let t9;
    	let t10;
    	let p2;
    	let t11;
    	let button0;
    	let t12_value = /*$LocaleSettings*/ ctx[4].openUnit + "";
    	let t12;
    	let t13;
    	let button1;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*showModal*/ ctx[2] && create_if_block_2$2(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*unitData*/ ctx[0].rented) return create_if_block_1$3;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*unitData*/ ctx[0].rented) return create_if_block$4;
    		return create_else_block$1;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block2 = current_block_type_1(ctx);

    	return {
    		c() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div1 = element("div");
    			img = element("img");
    			t1 = space();
    			div0 = element("div");
    			p0 = element("p");
    			t2 = text(t2_value);
    			t3 = text(" [");
    			t4 = text(t4_value);
    			t5 = text("]");
    			t6 = space();
    			p1 = element("p");
    			t7 = text(t7_value);
    			t8 = space();
    			t9 = text(t9_value);
    			t10 = space();
    			p2 = element("p");
    			if_block1.c();
    			t11 = space();
    			button0 = element("button");
    			t12 = text(t12_value);
    			t13 = space();
    			button1 = element("button");
    			if_block2.c();
    			attr(img, "class", "w-1/2");
    			if (!src_url_equal(img.src, img_src_value = /*$UnitSettings*/ ctx[5][/*unitData*/ ctx[0].type].image)) attr(img, "src", img_src_value);
    			attr(img, "alt", img_alt_value = /*$UnitSettings*/ ctx[5][/*unitData*/ ctx[0].type].type);
    			attr(p0, "class", "font-bold");
    			attr(button0, "class", "py-1 px-4 mt-5 bg-gray-700 border-0 rounded font-sans uppercase transition-all duration-300 ease-in-out hover:shadow-lg hover:bg-purple-800");
    			attr(button1, "class", "py-1 px-4 mt-5 bg-gray-700 border-0 rounded font-sans uppercase transition-all duration-300 ease-in-out hover:shadow-lg hover:bg-purple-800");
    			attr(div0, "class", "text-xl font-sans uppercase text-center");
    			attr(div1, "class", "flex flex-col justify-around items-center rounded-lg shadow-lg text-white bg-gray-800 w-[300px]");
    		},
    		m(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert(target, t0, anchor);
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, t1);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t2);
    			append(p0, t3);
    			append(p0, t4);
    			append(p0, t5);
    			append(div0, t6);
    			append(div0, p1);
    			append(p1, t7);
    			append(p1, t8);
    			append(p1, t9);
    			append(div0, t10);
    			append(div0, p2);
    			if_block1.m(p2, null);
    			append(div0, t11);
    			append(div0, button0);
    			append(button0, t12);
    			append(div0, t13);
    			append(div0, button1);
    			if_block2.m(button1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(button0, "click", function () {
    						if (is_function(/*openUnit*/ ctx[7](`${/*unitData*/ ctx[0].id}`))) /*openUnit*/ ctx[7](`${/*unitData*/ ctx[0].id}`).apply(this, arguments);
    					}),
    					listen(button1, "click", function () {
    						if (is_function(/*sellUnit*/ ctx[6](`${/*unitData*/ ctx[0].id}`))) /*sellUnit*/ ctx[6](`${/*unitData*/ ctx[0].id}`).apply(this, arguments);
    					})
    				];

    				mounted = true;
    			}
    		},
    		p(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (/*showModal*/ ctx[2]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*showModal*/ 4) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2$2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*$UnitSettings, unitData*/ 33 && !src_url_equal(img.src, img_src_value = /*$UnitSettings*/ ctx[5][/*unitData*/ ctx[0].type].image)) {
    				attr(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*$UnitSettings, unitData*/ 33 && img_alt_value !== (img_alt_value = /*$UnitSettings*/ ctx[5][/*unitData*/ ctx[0].type].type)) {
    				attr(img, "alt", img_alt_value);
    			}

    			if ((!current || dirty & /*$UnitSettings, unitData*/ 33) && t2_value !== (t2_value = /*$UnitSettings*/ ctx[5][/*unitData*/ ctx[0].type].label + "")) set_data(t2, t2_value);
    			if ((!current || dirty & /*unitData*/ 1) && t4_value !== (t4_value = /*unitData*/ ctx[0].id + "")) set_data(t4, t4_value);
    			if ((!current || dirty & /*$LocaleSettings*/ 16) && t7_value !== (t7_value = /*$LocaleSettings*/ ctx[4].totalWeight + "")) set_data(t7, t7_value);
    			if ((!current || dirty & /*$UnitSettings, unitData*/ 33) && t9_value !== (t9_value = /*$UnitSettings*/ ctx[5][/*unitData*/ ctx[0].type].size + "")) set_data(t9, t9_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(p2, null);
    				}
    			}

    			if ((!current || dirty & /*$LocaleSettings*/ 16) && t12_value !== (t12_value = /*$LocaleSettings*/ ctx[4].openUnit + "")) set_data(t12, t12_value);

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block2) {
    				if_block2.p(ctx, dirty);
    			} else {
    				if_block2.d(1);
    				if_block2 = current_block_type_1(ctx);

    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(button1, null);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block0);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block0);
    			current = false;
    		},
    		d(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach(t0);
    			if (detaching) detach(div1);
    			if_block1.d();
    			if_block2.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $UnitLocations;
    	let $LocaleSettings;
    	let $UnitSettings;
    	component_subscribe($$self, UnitLocations, $$value => $$invalidate(9, $UnitLocations = $$value));
    	component_subscribe($$self, LocaleSettings, $$value => $$invalidate(4, $LocaleSettings = $$value));
    	component_subscribe($$self, UnitSettings, $$value => $$invalidate(5, $UnitSettings = $$value));
    	let { unitData } = $$props;
    	let { sellDecrease } = $$props;
    	let showModal = false;
    	let unitPrice = 0;

    	for (const type of $UnitLocations[unitData.location].types) {
    		if (type.type == unitData.type) {
    			unitData.rented
    			? unitPrice = type.rentPrice
    			: unitPrice = type.buyPrice;
    		}
    	}

    	function sellUnit(e) {
    		$$invalidate(2, showModal = true);
    	}

    	function openUnit(e) {
    		fetch("https://doughStorage/openUnit", {
    			method: "post",
    			body: JSON.stringify({ id: unitData.id })
    		});
    	}

    	function confirmAction(e) {
    		$$invalidate(2, showModal = false);

    		if (e.detail.option === "confirm") {
    			fetch("https://doughStorage/sellUnit", {
    				method: "post",
    				body: JSON.stringify({ id: unitData.id })
    			});
    		}
    	}

    	$$self.$$set = $$props => {
    		if ('unitData' in $$props) $$invalidate(0, unitData = $$props.unitData);
    		if ('sellDecrease' in $$props) $$invalidate(1, sellDecrease = $$props.sellDecrease);
    	};

    	return [
    		unitData,
    		sellDecrease,
    		showModal,
    		unitPrice,
    		$LocaleSettings,
    		$UnitSettings,
    		sellUnit,
    		openUnit,
    		confirmAction
    	];
    }

    class MyUnitCard extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { unitData: 0, sellDecrease: 1 });
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var check = function (it) {
      return it && it.Math == Math && it;
    };

    // https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
    var global$2 =
      // eslint-disable-next-line es/no-global-this -- safe
      check(typeof globalThis == 'object' && globalThis) ||
      check(typeof window == 'object' && window) ||
      // eslint-disable-next-line no-restricted-globals -- safe
      check(typeof self == 'object' && self) ||
      check(typeof commonjsGlobal == 'object' && commonjsGlobal) ||
      // eslint-disable-next-line no-new-func -- fallback
      (function () { return this; })() || Function('return this')();

    var fails = function (exec) {
      try {
        return !!exec();
      } catch (error) {
        return true;
      }
    };

    // Detect IE8's incomplete defineProperty implementation
    var descriptors = !fails(function () {
      // eslint-disable-next-line es/no-object-defineproperty -- required for testing
      return Object.defineProperty({}, 1, { get: function () { return 7; } })[1] != 7;
    });

    var call$2 = Function.prototype.call;

    var functionCall = call$2.bind ? call$2.bind(call$2) : function () {
      return call$2.apply(call$2, arguments);
    };

    var $propertyIsEnumerable = {}.propertyIsEnumerable;
    // eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
    var getOwnPropertyDescriptor$1 = Object.getOwnPropertyDescriptor;

    // Nashorn ~ JDK8 bug
    var NASHORN_BUG = getOwnPropertyDescriptor$1 && !$propertyIsEnumerable.call({ 1: 2 }, 1);

    // `Object.prototype.propertyIsEnumerable` method implementation
    // https://tc39.es/ecma262/#sec-object.prototype.propertyisenumerable
    var f$5 = NASHORN_BUG ? function propertyIsEnumerable(V) {
      var descriptor = getOwnPropertyDescriptor$1(this, V);
      return !!descriptor && descriptor.enumerable;
    } : $propertyIsEnumerable;

    var objectPropertyIsEnumerable = {
    	f: f$5
    };

    var createPropertyDescriptor = function (bitmap, value) {
      return {
        enumerable: !(bitmap & 1),
        configurable: !(bitmap & 2),
        writable: !(bitmap & 4),
        value: value
      };
    };

    var FunctionPrototype$3 = Function.prototype;
    var bind$2 = FunctionPrototype$3.bind;
    var call$1 = FunctionPrototype$3.call;
    var callBind = bind$2 && bind$2.bind(call$1);

    var functionUncurryThis = bind$2 ? function (fn) {
      return fn && callBind(call$1, fn);
    } : function (fn) {
      return fn && function () {
        return call$1.apply(fn, arguments);
      };
    };

    var toString$2 = functionUncurryThis({}.toString);
    var stringSlice$4 = functionUncurryThis(''.slice);

    var classofRaw = function (it) {
      return stringSlice$4(toString$2(it), 8, -1);
    };

    var Object$5 = global$2.Object;
    var split = functionUncurryThis(''.split);

    // fallback for non-array-like ES3 and non-enumerable old V8 strings
    var indexedObject = fails(function () {
      // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
      // eslint-disable-next-line no-prototype-builtins -- safe
      return !Object$5('z').propertyIsEnumerable(0);
    }) ? function (it) {
      return classofRaw(it) == 'String' ? split(it, '') : Object$5(it);
    } : Object$5;

    var TypeError$d = global$2.TypeError;

    // `RequireObjectCoercible` abstract operation
    // https://tc39.es/ecma262/#sec-requireobjectcoercible
    var requireObjectCoercible = function (it) {
      if (it == undefined) throw TypeError$d("Can't call method on " + it);
      return it;
    };

    // toObject with fallback for non-array-like ES3 strings



    var toIndexedObject = function (it) {
      return indexedObject(requireObjectCoercible(it));
    };

    // `IsCallable` abstract operation
    // https://tc39.es/ecma262/#sec-iscallable
    var isCallable = function (argument) {
      return typeof argument == 'function';
    };

    var isObject$3 = function (it) {
      return typeof it == 'object' ? it !== null : isCallable(it);
    };

    var aFunction = function (argument) {
      return isCallable(argument) ? argument : undefined;
    };

    var getBuiltIn = function (namespace, method) {
      return arguments.length < 2 ? aFunction(global$2[namespace]) : global$2[namespace] && global$2[namespace][method];
    };

    var objectIsPrototypeOf = functionUncurryThis({}.isPrototypeOf);

    var engineUserAgent = getBuiltIn('navigator', 'userAgent') || '';

    var process$1 = global$2.process;
    var Deno = global$2.Deno;
    var versions = process$1 && process$1.versions || Deno && Deno.version;
    var v8 = versions && versions.v8;
    var match, version;

    if (v8) {
      match = v8.split('.');
      // in old Chrome, versions of V8 isn't V8 = Chrome / 10
      // but their correct versions are not interesting for us
      version = match[0] > 0 && match[0] < 4 ? 1 : +(match[0] + match[1]);
    }

    // BrowserFS NodeJS `process` polyfill incorrectly set `.v8` to `0.0`
    // so check `userAgent` even if `.v8` exists, but 0
    if (!version && engineUserAgent) {
      match = engineUserAgent.match(/Edge\/(\d+)/);
      if (!match || match[1] >= 74) {
        match = engineUserAgent.match(/Chrome\/(\d+)/);
        if (match) version = +match[1];
      }
    }

    var engineV8Version = version;

    /* eslint-disable es/no-symbol -- required for testing */

    // eslint-disable-next-line es/no-object-getownpropertysymbols -- required for testing
    var nativeSymbol = !!Object.getOwnPropertySymbols && !fails(function () {
      var symbol = Symbol();
      // Chrome 38 Symbol has incorrect toString conversion
      // `get-own-property-symbols` polyfill symbols converted to object are not Symbol instances
      return !String(symbol) || !(Object(symbol) instanceof Symbol) ||
        // Chrome 38-40 symbols are not inherited from DOM collections prototypes to instances
        !Symbol.sham && engineV8Version && engineV8Version < 41;
    });

    /* eslint-disable es/no-symbol -- required for testing */

    var useSymbolAsUid = nativeSymbol
      && !Symbol.sham
      && typeof Symbol.iterator == 'symbol';

    var Object$4 = global$2.Object;

    var isSymbol$2 = useSymbolAsUid ? function (it) {
      return typeof it == 'symbol';
    } : function (it) {
      var $Symbol = getBuiltIn('Symbol');
      return isCallable($Symbol) && objectIsPrototypeOf($Symbol.prototype, Object$4(it));
    };

    var String$4 = global$2.String;

    var tryToString = function (argument) {
      try {
        return String$4(argument);
      } catch (error) {
        return 'Object';
      }
    };

    var TypeError$c = global$2.TypeError;

    // `Assert: IsCallable(argument) is true`
    var aCallable = function (argument) {
      if (isCallable(argument)) return argument;
      throw TypeError$c(tryToString(argument) + ' is not a function');
    };

    // `GetMethod` abstract operation
    // https://tc39.es/ecma262/#sec-getmethod
    var getMethod = function (V, P) {
      var func = V[P];
      return func == null ? undefined : aCallable(func);
    };

    var TypeError$b = global$2.TypeError;

    // `OrdinaryToPrimitive` abstract operation
    // https://tc39.es/ecma262/#sec-ordinarytoprimitive
    var ordinaryToPrimitive = function (input, pref) {
      var fn, val;
      if (pref === 'string' && isCallable(fn = input.toString) && !isObject$3(val = functionCall(fn, input))) return val;
      if (isCallable(fn = input.valueOf) && !isObject$3(val = functionCall(fn, input))) return val;
      if (pref !== 'string' && isCallable(fn = input.toString) && !isObject$3(val = functionCall(fn, input))) return val;
      throw TypeError$b("Can't convert object to primitive value");
    };

    // eslint-disable-next-line es/no-object-defineproperty -- safe
    var defineProperty$4 = Object.defineProperty;

    var setGlobal = function (key, value) {
      try {
        defineProperty$4(global$2, key, { value: value, configurable: true, writable: true });
      } catch (error) {
        global$2[key] = value;
      } return value;
    };

    var SHARED = '__core-js_shared__';
    var store$1 = global$2[SHARED] || setGlobal(SHARED, {});

    var sharedStore = store$1;

    var shared = createCommonjsModule(function (module) {
    (module.exports = function (key, value) {
      return sharedStore[key] || (sharedStore[key] = value !== undefined ? value : {});
    })('versions', []).push({
      version: '3.20.0',
      mode: 'global',
      copyright: '?? 2021 Denis Pushkarev (zloirock.ru)'
    });
    });

    var Object$3 = global$2.Object;

    // `ToObject` abstract operation
    // https://tc39.es/ecma262/#sec-toobject
    var toObject = function (argument) {
      return Object$3(requireObjectCoercible(argument));
    };

    var hasOwnProperty$1 = functionUncurryThis({}.hasOwnProperty);

    // `HasOwnProperty` abstract operation
    // https://tc39.es/ecma262/#sec-hasownproperty
    var hasOwnProperty_1 = Object.hasOwn || function hasOwn(it, key) {
      return hasOwnProperty$1(toObject(it), key);
    };

    var id$1 = 0;
    var postfix = Math.random();
    var toString$1 = functionUncurryThis(1.0.toString);

    var uid = function (key) {
      return 'Symbol(' + (key === undefined ? '' : key) + ')_' + toString$1(++id$1 + postfix, 36);
    };

    var WellKnownSymbolsStore = shared('wks');
    var Symbol$2 = global$2.Symbol;
    var symbolFor = Symbol$2 && Symbol$2['for'];
    var createWellKnownSymbol = useSymbolAsUid ? Symbol$2 : Symbol$2 && Symbol$2.withoutSetter || uid;

    var wellKnownSymbol = function (name) {
      if (!hasOwnProperty_1(WellKnownSymbolsStore, name) || !(nativeSymbol || typeof WellKnownSymbolsStore[name] == 'string')) {
        var description = 'Symbol.' + name;
        if (nativeSymbol && hasOwnProperty_1(Symbol$2, name)) {
          WellKnownSymbolsStore[name] = Symbol$2[name];
        } else if (useSymbolAsUid && symbolFor) {
          WellKnownSymbolsStore[name] = symbolFor(description);
        } else {
          WellKnownSymbolsStore[name] = createWellKnownSymbol(description);
        }
      } return WellKnownSymbolsStore[name];
    };

    var TypeError$a = global$2.TypeError;
    var TO_PRIMITIVE = wellKnownSymbol('toPrimitive');

    // `ToPrimitive` abstract operation
    // https://tc39.es/ecma262/#sec-toprimitive
    var toPrimitive = function (input, pref) {
      if (!isObject$3(input) || isSymbol$2(input)) return input;
      var exoticToPrim = getMethod(input, TO_PRIMITIVE);
      var result;
      if (exoticToPrim) {
        if (pref === undefined) pref = 'default';
        result = functionCall(exoticToPrim, input, pref);
        if (!isObject$3(result) || isSymbol$2(result)) return result;
        throw TypeError$a("Can't convert object to primitive value");
      }
      if (pref === undefined) pref = 'number';
      return ordinaryToPrimitive(input, pref);
    };

    // `ToPropertyKey` abstract operation
    // https://tc39.es/ecma262/#sec-topropertykey
    var toPropertyKey = function (argument) {
      var key = toPrimitive(argument, 'string');
      return isSymbol$2(key) ? key : key + '';
    };

    var document$1 = global$2.document;
    // typeof document.createElement is 'object' in old IE
    var EXISTS$1 = isObject$3(document$1) && isObject$3(document$1.createElement);

    var documentCreateElement = function (it) {
      return EXISTS$1 ? document$1.createElement(it) : {};
    };

    // Thank's IE8 for his funny defineProperty
    var ie8DomDefine = !descriptors && !fails(function () {
      // eslint-disable-next-line es/no-object-defineproperty -- requied for testing
      return Object.defineProperty(documentCreateElement('div'), 'a', {
        get: function () { return 7; }
      }).a != 7;
    });

    // eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
    var $getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

    // `Object.getOwnPropertyDescriptor` method
    // https://tc39.es/ecma262/#sec-object.getownpropertydescriptor
    var f$4 = descriptors ? $getOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
      O = toIndexedObject(O);
      P = toPropertyKey(P);
      if (ie8DomDefine) try {
        return $getOwnPropertyDescriptor(O, P);
      } catch (error) { /* empty */ }
      if (hasOwnProperty_1(O, P)) return createPropertyDescriptor(!functionCall(objectPropertyIsEnumerable.f, O, P), O[P]);
    };

    var objectGetOwnPropertyDescriptor = {
    	f: f$4
    };

    var String$3 = global$2.String;
    var TypeError$9 = global$2.TypeError;

    // `Assert: Type(argument) is Object`
    var anObject = function (argument) {
      if (isObject$3(argument)) return argument;
      throw TypeError$9(String$3(argument) + ' is not an object');
    };

    var TypeError$8 = global$2.TypeError;
    // eslint-disable-next-line es/no-object-defineproperty -- safe
    var $defineProperty = Object.defineProperty;

    // `Object.defineProperty` method
    // https://tc39.es/ecma262/#sec-object.defineproperty
    var f$3 = descriptors ? $defineProperty : function defineProperty(O, P, Attributes) {
      anObject(O);
      P = toPropertyKey(P);
      anObject(Attributes);
      if (ie8DomDefine) try {
        return $defineProperty(O, P, Attributes);
      } catch (error) { /* empty */ }
      if ('get' in Attributes || 'set' in Attributes) throw TypeError$8('Accessors not supported');
      if ('value' in Attributes) O[P] = Attributes.value;
      return O;
    };

    var objectDefineProperty = {
    	f: f$3
    };

    var createNonEnumerableProperty = descriptors ? function (object, key, value) {
      return objectDefineProperty.f(object, key, createPropertyDescriptor(1, value));
    } : function (object, key, value) {
      object[key] = value;
      return object;
    };

    var functionToString$1 = functionUncurryThis(Function.toString);

    // this helper broken in `core-js@3.4.1-3.4.4`, so we can't use `shared` helper
    if (!isCallable(sharedStore.inspectSource)) {
      sharedStore.inspectSource = function (it) {
        return functionToString$1(it);
      };
    }

    var inspectSource = sharedStore.inspectSource;

    var WeakMap$2 = global$2.WeakMap;

    var nativeWeakMap = isCallable(WeakMap$2) && /native code/.test(inspectSource(WeakMap$2));

    var keys = shared('keys');

    var sharedKey = function (key) {
      return keys[key] || (keys[key] = uid(key));
    };

    var hiddenKeys$1 = {};

    var OBJECT_ALREADY_INITIALIZED = 'Object already initialized';
    var TypeError$7 = global$2.TypeError;
    var WeakMap$1 = global$2.WeakMap;
    var set, get, has;

    var enforce = function (it) {
      return has(it) ? get(it) : set(it, {});
    };

    var getterFor = function (TYPE) {
      return function (it) {
        var state;
        if (!isObject$3(it) || (state = get(it)).type !== TYPE) {
          throw TypeError$7('Incompatible receiver, ' + TYPE + ' required');
        } return state;
      };
    };

    if (nativeWeakMap || sharedStore.state) {
      var store = sharedStore.state || (sharedStore.state = new WeakMap$1());
      var wmget = functionUncurryThis(store.get);
      var wmhas = functionUncurryThis(store.has);
      var wmset = functionUncurryThis(store.set);
      set = function (it, metadata) {
        if (wmhas(store, it)) throw new TypeError$7(OBJECT_ALREADY_INITIALIZED);
        metadata.facade = it;
        wmset(store, it, metadata);
        return metadata;
      };
      get = function (it) {
        return wmget(store, it) || {};
      };
      has = function (it) {
        return wmhas(store, it);
      };
    } else {
      var STATE = sharedKey('state');
      hiddenKeys$1[STATE] = true;
      set = function (it, metadata) {
        if (hasOwnProperty_1(it, STATE)) throw new TypeError$7(OBJECT_ALREADY_INITIALIZED);
        metadata.facade = it;
        createNonEnumerableProperty(it, STATE, metadata);
        return metadata;
      };
      get = function (it) {
        return hasOwnProperty_1(it, STATE) ? it[STATE] : {};
      };
      has = function (it) {
        return hasOwnProperty_1(it, STATE);
      };
    }

    var internalState = {
      set: set,
      get: get,
      has: has,
      enforce: enforce,
      getterFor: getterFor
    };

    var FunctionPrototype$2 = Function.prototype;
    // eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
    var getDescriptor = descriptors && Object.getOwnPropertyDescriptor;

    var EXISTS = hasOwnProperty_1(FunctionPrototype$2, 'name');
    // additional protection from minified / mangled / dropped function names
    var PROPER = EXISTS && (function something() { /* empty */ }).name === 'something';
    var CONFIGURABLE = EXISTS && (!descriptors || (descriptors && getDescriptor(FunctionPrototype$2, 'name').configurable));

    var functionName = {
      EXISTS: EXISTS,
      PROPER: PROPER,
      CONFIGURABLE: CONFIGURABLE
    };

    var redefine = createCommonjsModule(function (module) {
    var CONFIGURABLE_FUNCTION_NAME = functionName.CONFIGURABLE;

    var getInternalState = internalState.get;
    var enforceInternalState = internalState.enforce;
    var TEMPLATE = String(String).split('String');

    (module.exports = function (O, key, value, options) {
      var unsafe = options ? !!options.unsafe : false;
      var simple = options ? !!options.enumerable : false;
      var noTargetGet = options ? !!options.noTargetGet : false;
      var name = options && options.name !== undefined ? options.name : key;
      var state;
      if (isCallable(value)) {
        if (String(name).slice(0, 7) === 'Symbol(') {
          name = '[' + String(name).replace(/^Symbol\(([^)]*)\)/, '$1') + ']';
        }
        if (!hasOwnProperty_1(value, 'name') || (CONFIGURABLE_FUNCTION_NAME && value.name !== name)) {
          createNonEnumerableProperty(value, 'name', name);
        }
        state = enforceInternalState(value);
        if (!state.source) {
          state.source = TEMPLATE.join(typeof name == 'string' ? name : '');
        }
      }
      if (O === global$2) {
        if (simple) O[key] = value;
        else setGlobal(key, value);
        return;
      } else if (!unsafe) {
        delete O[key];
      } else if (!noTargetGet && O[key]) {
        simple = true;
      }
      if (simple) O[key] = value;
      else createNonEnumerableProperty(O, key, value);
    // add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
    })(Function.prototype, 'toString', function toString() {
      return isCallable(this) && getInternalState(this).source || inspectSource(this);
    });
    });

    var ceil = Math.ceil;
    var floor$1 = Math.floor;

    // `ToIntegerOrInfinity` abstract operation
    // https://tc39.es/ecma262/#sec-tointegerorinfinity
    var toIntegerOrInfinity = function (argument) {
      var number = +argument;
      // eslint-disable-next-line no-self-compare -- safe
      return number !== number || number === 0 ? 0 : (number > 0 ? floor$1 : ceil)(number);
    };

    var max$2 = Math.max;
    var min$2 = Math.min;

    // Helper for a popular repeating case of the spec:
    // Let integer be ? ToInteger(index).
    // If integer < 0, let result be max((length + integer), 0); else let result be min(integer, length).
    var toAbsoluteIndex = function (index, length) {
      var integer = toIntegerOrInfinity(index);
      return integer < 0 ? max$2(integer + length, 0) : min$2(integer, length);
    };

    var min$1 = Math.min;

    // `ToLength` abstract operation
    // https://tc39.es/ecma262/#sec-tolength
    var toLength = function (argument) {
      return argument > 0 ? min$1(toIntegerOrInfinity(argument), 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
    };

    // `LengthOfArrayLike` abstract operation
    // https://tc39.es/ecma262/#sec-lengthofarraylike
    var lengthOfArrayLike = function (obj) {
      return toLength(obj.length);
    };

    // `Array.prototype.{ indexOf, includes }` methods implementation
    var createMethod$4 = function (IS_INCLUDES) {
      return function ($this, el, fromIndex) {
        var O = toIndexedObject($this);
        var length = lengthOfArrayLike(O);
        var index = toAbsoluteIndex(fromIndex, length);
        var value;
        // Array#includes uses SameValueZero equality algorithm
        // eslint-disable-next-line no-self-compare -- NaN check
        if (IS_INCLUDES && el != el) while (length > index) {
          value = O[index++];
          // eslint-disable-next-line no-self-compare -- NaN check
          if (value != value) return true;
        // Array#indexOf ignores holes, Array#includes - not
        } else for (;length > index; index++) {
          if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
        } return !IS_INCLUDES && -1;
      };
    };

    var arrayIncludes = {
      // `Array.prototype.includes` method
      // https://tc39.es/ecma262/#sec-array.prototype.includes
      includes: createMethod$4(true),
      // `Array.prototype.indexOf` method
      // https://tc39.es/ecma262/#sec-array.prototype.indexof
      indexOf: createMethod$4(false)
    };

    var indexOf$1 = arrayIncludes.indexOf;


    var push$2 = functionUncurryThis([].push);

    var objectKeysInternal = function (object, names) {
      var O = toIndexedObject(object);
      var i = 0;
      var result = [];
      var key;
      for (key in O) !hasOwnProperty_1(hiddenKeys$1, key) && hasOwnProperty_1(O, key) && push$2(result, key);
      // Don't enum bug & hidden keys
      while (names.length > i) if (hasOwnProperty_1(O, key = names[i++])) {
        ~indexOf$1(result, key) || push$2(result, key);
      }
      return result;
    };

    // IE8- don't enum bug keys
    var enumBugKeys = [
      'constructor',
      'hasOwnProperty',
      'isPrototypeOf',
      'propertyIsEnumerable',
      'toLocaleString',
      'toString',
      'valueOf'
    ];

    var hiddenKeys = enumBugKeys.concat('length', 'prototype');

    // `Object.getOwnPropertyNames` method
    // https://tc39.es/ecma262/#sec-object.getownpropertynames
    // eslint-disable-next-line es/no-object-getownpropertynames -- safe
    var f$2 = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
      return objectKeysInternal(O, hiddenKeys);
    };

    var objectGetOwnPropertyNames = {
    	f: f$2
    };

    // eslint-disable-next-line es/no-object-getownpropertysymbols -- safe
    var f$1 = Object.getOwnPropertySymbols;

    var objectGetOwnPropertySymbols = {
    	f: f$1
    };

    var concat$2 = functionUncurryThis([].concat);

    // all object keys, includes non-enumerable and symbols
    var ownKeys = getBuiltIn('Reflect', 'ownKeys') || function ownKeys(it) {
      var keys = objectGetOwnPropertyNames.f(anObject(it));
      var getOwnPropertySymbols = objectGetOwnPropertySymbols.f;
      return getOwnPropertySymbols ? concat$2(keys, getOwnPropertySymbols(it)) : keys;
    };

    var copyConstructorProperties = function (target, source, exceptions) {
      var keys = ownKeys(source);
      var defineProperty = objectDefineProperty.f;
      var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f;
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (!hasOwnProperty_1(target, key) && !(exceptions && hasOwnProperty_1(exceptions, key))) {
          defineProperty(target, key, getOwnPropertyDescriptor(source, key));
        }
      }
    };

    var replacement = /#|\.prototype\./;

    var isForced = function (feature, detection) {
      var value = data[normalize(feature)];
      return value == POLYFILL ? true
        : value == NATIVE ? false
        : isCallable(detection) ? fails(detection)
        : !!detection;
    };

    var normalize = isForced.normalize = function (string) {
      return String(string).replace(replacement, '.').toLowerCase();
    };

    var data = isForced.data = {};
    var NATIVE = isForced.NATIVE = 'N';
    var POLYFILL = isForced.POLYFILL = 'P';

    var isForced_1 = isForced;

    var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f;






    /*
      options.target      - name of the target object
      options.global      - target is the global object
      options.stat        - export as static methods of target
      options.proto       - export as prototype methods of target
      options.real        - real prototype method for the `pure` version
      options.forced      - export even if the native feature is available
      options.bind        - bind methods to the target, required for the `pure` version
      options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
      options.unsafe      - use the simple assignment of property instead of delete + defineProperty
      options.sham        - add a flag to not completely full polyfills
      options.enumerable  - export as enumerable property
      options.noTargetGet - prevent calling a getter on target
      options.name        - the .name of the function if it does not match the key
    */
    var _export = function (options, source) {
      var TARGET = options.target;
      var GLOBAL = options.global;
      var STATIC = options.stat;
      var FORCED, target, key, targetProperty, sourceProperty, descriptor;
      if (GLOBAL) {
        target = global$2;
      } else if (STATIC) {
        target = global$2[TARGET] || setGlobal(TARGET, {});
      } else {
        target = (global$2[TARGET] || {}).prototype;
      }
      if (target) for (key in source) {
        sourceProperty = source[key];
        if (options.noTargetGet) {
          descriptor = getOwnPropertyDescriptor(target, key);
          targetProperty = descriptor && descriptor.value;
        } else targetProperty = target[key];
        FORCED = isForced_1(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
        // contained in target
        if (!FORCED && targetProperty !== undefined) {
          if (typeof sourceProperty == typeof targetProperty) continue;
          copyConstructorProperties(sourceProperty, targetProperty);
        }
        // add a flag to not completely full polyfills
        if (options.sham || (targetProperty && targetProperty.sham)) {
          createNonEnumerableProperty(sourceProperty, 'sham', true);
        }
        // extend global
        redefine(target, key, sourceProperty, options);
      }
    };

    var bind$1 = functionUncurryThis(functionUncurryThis.bind);

    // optional / simple context binding
    var functionBindContext = function (fn, that) {
      aCallable(fn);
      return that === undefined ? fn : bind$1 ? bind$1(fn, that) : function (/* ...args */) {
        return fn.apply(that, arguments);
      };
    };

    // `IsArray` abstract operation
    // https://tc39.es/ecma262/#sec-isarray
    // eslint-disable-next-line es/no-array-isarray -- safe
    var isArray = Array.isArray || function isArray(argument) {
      return classofRaw(argument) == 'Array';
    };

    var TO_STRING_TAG$3 = wellKnownSymbol('toStringTag');
    var test = {};

    test[TO_STRING_TAG$3] = 'z';

    var toStringTagSupport = String(test) === '[object z]';

    var TO_STRING_TAG$2 = wellKnownSymbol('toStringTag');
    var Object$2 = global$2.Object;

    // ES3 wrong here
    var CORRECT_ARGUMENTS = classofRaw(function () { return arguments; }()) == 'Arguments';

    // fallback for IE11 Script Access Denied error
    var tryGet = function (it, key) {
      try {
        return it[key];
      } catch (error) { /* empty */ }
    };

    // getting tag from ES6+ `Object.prototype.toString`
    var classof = toStringTagSupport ? classofRaw : function (it) {
      var O, tag, result;
      return it === undefined ? 'Undefined' : it === null ? 'Null'
        // @@toStringTag case
        : typeof (tag = tryGet(O = Object$2(it), TO_STRING_TAG$2)) == 'string' ? tag
        // builtinTag case
        : CORRECT_ARGUMENTS ? classofRaw(O)
        // ES3 arguments fallback
        : (result = classofRaw(O)) == 'Object' && isCallable(O.callee) ? 'Arguments' : result;
    };

    var noop = function () { /* empty */ };
    var empty = [];
    var construct = getBuiltIn('Reflect', 'construct');
    var constructorRegExp = /^\s*(?:class|function)\b/;
    var exec$1 = functionUncurryThis(constructorRegExp.exec);
    var INCORRECT_TO_STRING = !constructorRegExp.exec(noop);

    var isConstructorModern = function isConstructor(argument) {
      if (!isCallable(argument)) return false;
      try {
        construct(noop, empty, argument);
        return true;
      } catch (error) {
        return false;
      }
    };

    var isConstructorLegacy = function isConstructor(argument) {
      if (!isCallable(argument)) return false;
      switch (classof(argument)) {
        case 'AsyncFunction':
        case 'GeneratorFunction':
        case 'AsyncGeneratorFunction': return false;
      }
      try {
        // we can't check .prototype since constructors produced by .bind haven't it
        // `Function#toString` throws on some built-it function in some legacy engines
        // (for example, `DOMQuad` and similar in FF41-)
        return INCORRECT_TO_STRING || !!exec$1(constructorRegExp, inspectSource(argument));
      } catch (error) {
        return true;
      }
    };

    isConstructorLegacy.sham = true;

    // `IsConstructor` abstract operation
    // https://tc39.es/ecma262/#sec-isconstructor
    var isConstructor = !construct || fails(function () {
      var called;
      return isConstructorModern(isConstructorModern.call)
        || !isConstructorModern(Object)
        || !isConstructorModern(function () { called = true; })
        || called;
    }) ? isConstructorLegacy : isConstructorModern;

    var SPECIES$2 = wellKnownSymbol('species');
    var Array$2 = global$2.Array;

    // a part of `ArraySpeciesCreate` abstract operation
    // https://tc39.es/ecma262/#sec-arrayspeciescreate
    var arraySpeciesConstructor = function (originalArray) {
      var C;
      if (isArray(originalArray)) {
        C = originalArray.constructor;
        // cross-realm fallback
        if (isConstructor(C) && (C === Array$2 || isArray(C.prototype))) C = undefined;
        else if (isObject$3(C)) {
          C = C[SPECIES$2];
          if (C === null) C = undefined;
        }
      } return C === undefined ? Array$2 : C;
    };

    // `ArraySpeciesCreate` abstract operation
    // https://tc39.es/ecma262/#sec-arrayspeciescreate
    var arraySpeciesCreate = function (originalArray, length) {
      return new (arraySpeciesConstructor(originalArray))(length === 0 ? 0 : length);
    };

    var push$1 = functionUncurryThis([].push);

    // `Array.prototype.{ forEach, map, filter, some, every, find, findIndex, filterReject }` methods implementation
    var createMethod$3 = function (TYPE) {
      var IS_MAP = TYPE == 1;
      var IS_FILTER = TYPE == 2;
      var IS_SOME = TYPE == 3;
      var IS_EVERY = TYPE == 4;
      var IS_FIND_INDEX = TYPE == 6;
      var IS_FILTER_REJECT = TYPE == 7;
      var NO_HOLES = TYPE == 5 || IS_FIND_INDEX;
      return function ($this, callbackfn, that, specificCreate) {
        var O = toObject($this);
        var self = indexedObject(O);
        var boundFunction = functionBindContext(callbackfn, that);
        var length = lengthOfArrayLike(self);
        var index = 0;
        var create = specificCreate || arraySpeciesCreate;
        var target = IS_MAP ? create($this, length) : IS_FILTER || IS_FILTER_REJECT ? create($this, 0) : undefined;
        var value, result;
        for (;length > index; index++) if (NO_HOLES || index in self) {
          value = self[index];
          result = boundFunction(value, index, O);
          if (TYPE) {
            if (IS_MAP) target[index] = result; // map
            else if (result) switch (TYPE) {
              case 3: return true;              // some
              case 5: return value;             // find
              case 6: return index;             // findIndex
              case 2: push$1(target, value);      // filter
            } else switch (TYPE) {
              case 4: return false;             // every
              case 7: push$1(target, value);      // filterReject
            }
          }
        }
        return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : target;
      };
    };

    var arrayIteration = {
      // `Array.prototype.forEach` method
      // https://tc39.es/ecma262/#sec-array.prototype.foreach
      forEach: createMethod$3(0),
      // `Array.prototype.map` method
      // https://tc39.es/ecma262/#sec-array.prototype.map
      map: createMethod$3(1),
      // `Array.prototype.filter` method
      // https://tc39.es/ecma262/#sec-array.prototype.filter
      filter: createMethod$3(2),
      // `Array.prototype.some` method
      // https://tc39.es/ecma262/#sec-array.prototype.some
      some: createMethod$3(3),
      // `Array.prototype.every` method
      // https://tc39.es/ecma262/#sec-array.prototype.every
      every: createMethod$3(4),
      // `Array.prototype.find` method
      // https://tc39.es/ecma262/#sec-array.prototype.find
      find: createMethod$3(5),
      // `Array.prototype.findIndex` method
      // https://tc39.es/ecma262/#sec-array.prototype.findIndex
      findIndex: createMethod$3(6),
      // `Array.prototype.filterReject` method
      // https://github.com/tc39/proposal-array-filtering
      filterReject: createMethod$3(7)
    };

    var arrayMethodIsStrict = function (METHOD_NAME, argument) {
      var method = [][METHOD_NAME];
      return !!method && fails(function () {
        // eslint-disable-next-line no-useless-call,no-throw-literal -- required for testing
        method.call(null, argument || function () { throw 1; }, 1);
      });
    };

    var $forEach = arrayIteration.forEach;


    var STRICT_METHOD$1 = arrayMethodIsStrict('forEach');

    // `Array.prototype.forEach` method implementation
    // https://tc39.es/ecma262/#sec-array.prototype.foreach
    var arrayForEach = !STRICT_METHOD$1 ? function forEach(callbackfn /* , thisArg */) {
      return $forEach(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    // eslint-disable-next-line es/no-array-prototype-foreach -- safe
    } : [].forEach;

    // `Array.prototype.forEach` method
    // https://tc39.es/ecma262/#sec-array.prototype.foreach
    // eslint-disable-next-line es/no-array-prototype-foreach -- safe
    _export({ target: 'Array', proto: true, forced: [].forEach != arrayForEach }, {
      forEach: arrayForEach
    });

    // iterable DOM collections
    // flag - `iterable` interface - 'entries', 'keys', 'values', 'forEach' methods
    var domIterables = {
      CSSRuleList: 0,
      CSSStyleDeclaration: 0,
      CSSValueList: 0,
      ClientRectList: 0,
      DOMRectList: 0,
      DOMStringList: 0,
      DOMTokenList: 1,
      DataTransferItemList: 0,
      FileList: 0,
      HTMLAllCollection: 0,
      HTMLCollection: 0,
      HTMLFormElement: 0,
      HTMLSelectElement: 0,
      MediaList: 0,
      MimeTypeArray: 0,
      NamedNodeMap: 0,
      NodeList: 1,
      PaintRequestList: 0,
      Plugin: 0,
      PluginArray: 0,
      SVGLengthList: 0,
      SVGNumberList: 0,
      SVGPathSegList: 0,
      SVGPointList: 0,
      SVGStringList: 0,
      SVGTransformList: 0,
      SourceBufferList: 0,
      StyleSheetList: 0,
      TextTrackCueList: 0,
      TextTrackList: 0,
      TouchList: 0
    };

    // in old WebKit versions, `element.classList` is not an instance of global `DOMTokenList`


    var classList = documentCreateElement('span').classList;
    var DOMTokenListPrototype = classList && classList.constructor && classList.constructor.prototype;

    var domTokenListPrototype = DOMTokenListPrototype === Object.prototype ? undefined : DOMTokenListPrototype;

    var handlePrototype$1 = function (CollectionPrototype) {
      // some Chrome versions have non-configurable methods on DOMTokenList
      if (CollectionPrototype && CollectionPrototype.forEach !== arrayForEach) try {
        createNonEnumerableProperty(CollectionPrototype, 'forEach', arrayForEach);
      } catch (error) {
        CollectionPrototype.forEach = arrayForEach;
      }
    };

    for (var COLLECTION_NAME$1 in domIterables) {
      if (domIterables[COLLECTION_NAME$1]) {
        handlePrototype$1(global$2[COLLECTION_NAME$1] && global$2[COLLECTION_NAME$1].prototype);
      }
    }

    handlePrototype$1(domTokenListPrototype);

    var canUseDOM = !!(
      typeof window !== 'undefined' &&
      window.document &&
      window.document.createElement
    );

    var canUseDom = canUseDOM;

    var SPECIES$1 = wellKnownSymbol('species');

    var arrayMethodHasSpeciesSupport = function (METHOD_NAME) {
      // We can't use this feature detection in V8 since it causes
      // deoptimization and serious performance degradation
      // https://github.com/zloirock/core-js/issues/677
      return engineV8Version >= 51 || !fails(function () {
        var array = [];
        var constructor = array.constructor = {};
        constructor[SPECIES$1] = function () {
          return { foo: 1 };
        };
        return array[METHOD_NAME](Boolean).foo !== 1;
      });
    };

    var $filter = arrayIteration.filter;


    var HAS_SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('filter');

    // `Array.prototype.filter` method
    // https://tc39.es/ecma262/#sec-array.prototype.filter
    // with adding support of @@species
    _export({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT }, {
      filter: function filter(callbackfn /* , thisArg */) {
        return $filter(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
      }
    });

    // `Object.keys` method
    // https://tc39.es/ecma262/#sec-object.keys
    // eslint-disable-next-line es/no-object-keys -- safe
    var objectKeys = Object.keys || function keys(O) {
      return objectKeysInternal(O, enumBugKeys);
    };

    // `Object.defineProperties` method
    // https://tc39.es/ecma262/#sec-object.defineproperties
    // eslint-disable-next-line es/no-object-defineproperties -- safe
    var objectDefineProperties = descriptors ? Object.defineProperties : function defineProperties(O, Properties) {
      anObject(O);
      var props = toIndexedObject(Properties);
      var keys = objectKeys(Properties);
      var length = keys.length;
      var index = 0;
      var key;
      while (length > index) objectDefineProperty.f(O, key = keys[index++], props[key]);
      return O;
    };

    var html = getBuiltIn('document', 'documentElement');

    /* global ActiveXObject -- old IE, WSH */

    var GT = '>';
    var LT = '<';
    var PROTOTYPE = 'prototype';
    var SCRIPT = 'script';
    var IE_PROTO$1 = sharedKey('IE_PROTO');

    var EmptyConstructor = function () { /* empty */ };

    var scriptTag = function (content) {
      return LT + SCRIPT + GT + content + LT + '/' + SCRIPT + GT;
    };

    // Create object with fake `null` prototype: use ActiveX Object with cleared prototype
    var NullProtoObjectViaActiveX = function (activeXDocument) {
      activeXDocument.write(scriptTag(''));
      activeXDocument.close();
      var temp = activeXDocument.parentWindow.Object;
      activeXDocument = null; // avoid memory leak
      return temp;
    };

    // Create object with fake `null` prototype: use iframe Object with cleared prototype
    var NullProtoObjectViaIFrame = function () {
      // Thrash, waste and sodomy: IE GC bug
      var iframe = documentCreateElement('iframe');
      var JS = 'java' + SCRIPT + ':';
      var iframeDocument;
      iframe.style.display = 'none';
      html.appendChild(iframe);
      // https://github.com/zloirock/core-js/issues/475
      iframe.src = String(JS);
      iframeDocument = iframe.contentWindow.document;
      iframeDocument.open();
      iframeDocument.write(scriptTag('document.F=Object'));
      iframeDocument.close();
      return iframeDocument.F;
    };

    // Check for document.domain and active x support
    // No need to use active x approach when document.domain is not set
    // see https://github.com/es-shims/es5-shim/issues/150
    // variation of https://github.com/kitcambridge/es5-shim/commit/4f738ac066346
    // avoid IE GC bug
    var activeXDocument;
    var NullProtoObject = function () {
      try {
        activeXDocument = new ActiveXObject('htmlfile');
      } catch (error) { /* ignore */ }
      NullProtoObject = typeof document != 'undefined'
        ? document.domain && activeXDocument
          ? NullProtoObjectViaActiveX(activeXDocument) // old IE
          : NullProtoObjectViaIFrame()
        : NullProtoObjectViaActiveX(activeXDocument); // WSH
      var length = enumBugKeys.length;
      while (length--) delete NullProtoObject[PROTOTYPE][enumBugKeys[length]];
      return NullProtoObject();
    };

    hiddenKeys$1[IE_PROTO$1] = true;

    // `Object.create` method
    // https://tc39.es/ecma262/#sec-object.create
    var objectCreate = Object.create || function create(O, Properties) {
      var result;
      if (O !== null) {
        EmptyConstructor[PROTOTYPE] = anObject(O);
        result = new EmptyConstructor();
        EmptyConstructor[PROTOTYPE] = null;
        // add "__proto__" for Object.getPrototypeOf polyfill
        result[IE_PROTO$1] = O;
      } else result = NullProtoObject();
      return Properties === undefined ? result : objectDefineProperties(result, Properties);
    };

    var UNSCOPABLES = wellKnownSymbol('unscopables');
    var ArrayPrototype$1 = Array.prototype;

    // Array.prototype[@@unscopables]
    // https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
    if (ArrayPrototype$1[UNSCOPABLES] == undefined) {
      objectDefineProperty.f(ArrayPrototype$1, UNSCOPABLES, {
        configurable: true,
        value: objectCreate(null)
      });
    }

    // add a key to Array.prototype[@@unscopables]
    var addToUnscopables = function (key) {
      ArrayPrototype$1[UNSCOPABLES][key] = true;
    };

    var iterators = {};

    var correctPrototypeGetter = !fails(function () {
      function F() { /* empty */ }
      F.prototype.constructor = null;
      // eslint-disable-next-line es/no-object-getprototypeof -- required for testing
      return Object.getPrototypeOf(new F()) !== F.prototype;
    });

    var IE_PROTO = sharedKey('IE_PROTO');
    var Object$1 = global$2.Object;
    var ObjectPrototype = Object$1.prototype;

    // `Object.getPrototypeOf` method
    // https://tc39.es/ecma262/#sec-object.getprototypeof
    var objectGetPrototypeOf = correctPrototypeGetter ? Object$1.getPrototypeOf : function (O) {
      var object = toObject(O);
      if (hasOwnProperty_1(object, IE_PROTO)) return object[IE_PROTO];
      var constructor = object.constructor;
      if (isCallable(constructor) && object instanceof constructor) {
        return constructor.prototype;
      } return object instanceof Object$1 ? ObjectPrototype : null;
    };

    var ITERATOR$6 = wellKnownSymbol('iterator');
    var BUGGY_SAFARI_ITERATORS$1 = false;

    // `%IteratorPrototype%` object
    // https://tc39.es/ecma262/#sec-%iteratorprototype%-object
    var IteratorPrototype$2, PrototypeOfArrayIteratorPrototype, arrayIterator;

    /* eslint-disable es/no-array-prototype-keys -- safe */
    if ([].keys) {
      arrayIterator = [].keys();
      // Safari 8 has buggy iterators w/o `next`
      if (!('next' in arrayIterator)) BUGGY_SAFARI_ITERATORS$1 = true;
      else {
        PrototypeOfArrayIteratorPrototype = objectGetPrototypeOf(objectGetPrototypeOf(arrayIterator));
        if (PrototypeOfArrayIteratorPrototype !== Object.prototype) IteratorPrototype$2 = PrototypeOfArrayIteratorPrototype;
      }
    }

    var NEW_ITERATOR_PROTOTYPE = IteratorPrototype$2 == undefined || fails(function () {
      var test = {};
      // FF44- legacy iterators case
      return IteratorPrototype$2[ITERATOR$6].call(test) !== test;
    });

    if (NEW_ITERATOR_PROTOTYPE) IteratorPrototype$2 = {};

    // `%IteratorPrototype%[@@iterator]()` method
    // https://tc39.es/ecma262/#sec-%iteratorprototype%-@@iterator
    if (!isCallable(IteratorPrototype$2[ITERATOR$6])) {
      redefine(IteratorPrototype$2, ITERATOR$6, function () {
        return this;
      });
    }

    var iteratorsCore = {
      IteratorPrototype: IteratorPrototype$2,
      BUGGY_SAFARI_ITERATORS: BUGGY_SAFARI_ITERATORS$1
    };

    var defineProperty$3 = objectDefineProperty.f;



    var TO_STRING_TAG$1 = wellKnownSymbol('toStringTag');

    var setToStringTag = function (target, TAG, STATIC) {
      if (target && !STATIC) target = target.prototype;
      if (target && !hasOwnProperty_1(target, TO_STRING_TAG$1)) {
        defineProperty$3(target, TO_STRING_TAG$1, { configurable: true, value: TAG });
      }
    };

    var IteratorPrototype$1 = iteratorsCore.IteratorPrototype;





    var returnThis$1 = function () { return this; };

    var createIteratorConstructor = function (IteratorConstructor, NAME, next, ENUMERABLE_NEXT) {
      var TO_STRING_TAG = NAME + ' Iterator';
      IteratorConstructor.prototype = objectCreate(IteratorPrototype$1, { next: createPropertyDescriptor(+!ENUMERABLE_NEXT, next) });
      setToStringTag(IteratorConstructor, TO_STRING_TAG, false);
      iterators[TO_STRING_TAG] = returnThis$1;
      return IteratorConstructor;
    };

    var String$2 = global$2.String;
    var TypeError$6 = global$2.TypeError;

    var aPossiblePrototype = function (argument) {
      if (typeof argument == 'object' || isCallable(argument)) return argument;
      throw TypeError$6("Can't set " + String$2(argument) + ' as a prototype');
    };

    /* eslint-disable no-proto -- safe */

    // `Object.setPrototypeOf` method
    // https://tc39.es/ecma262/#sec-object.setprototypeof
    // Works with __proto__ only. Old v8 can't work with null proto objects.
    // eslint-disable-next-line es/no-object-setprototypeof -- safe
    var objectSetPrototypeOf = Object.setPrototypeOf || ('__proto__' in {} ? function () {
      var CORRECT_SETTER = false;
      var test = {};
      var setter;
      try {
        // eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
        setter = functionUncurryThis(Object.getOwnPropertyDescriptor(Object.prototype, '__proto__').set);
        setter(test, []);
        CORRECT_SETTER = test instanceof Array;
      } catch (error) { /* empty */ }
      return function setPrototypeOf(O, proto) {
        anObject(O);
        aPossiblePrototype(proto);
        if (CORRECT_SETTER) setter(O, proto);
        else O.__proto__ = proto;
        return O;
      };
    }() : undefined);

    var PROPER_FUNCTION_NAME = functionName.PROPER;
    var CONFIGURABLE_FUNCTION_NAME = functionName.CONFIGURABLE;
    var IteratorPrototype = iteratorsCore.IteratorPrototype;
    var BUGGY_SAFARI_ITERATORS = iteratorsCore.BUGGY_SAFARI_ITERATORS;
    var ITERATOR$5 = wellKnownSymbol('iterator');
    var KEYS = 'keys';
    var VALUES = 'values';
    var ENTRIES = 'entries';

    var returnThis = function () { return this; };

    var defineIterator = function (Iterable, NAME, IteratorConstructor, next, DEFAULT, IS_SET, FORCED) {
      createIteratorConstructor(IteratorConstructor, NAME, next);

      var getIterationMethod = function (KIND) {
        if (KIND === DEFAULT && defaultIterator) return defaultIterator;
        if (!BUGGY_SAFARI_ITERATORS && KIND in IterablePrototype) return IterablePrototype[KIND];
        switch (KIND) {
          case KEYS: return function keys() { return new IteratorConstructor(this, KIND); };
          case VALUES: return function values() { return new IteratorConstructor(this, KIND); };
          case ENTRIES: return function entries() { return new IteratorConstructor(this, KIND); };
        } return function () { return new IteratorConstructor(this); };
      };

      var TO_STRING_TAG = NAME + ' Iterator';
      var INCORRECT_VALUES_NAME = false;
      var IterablePrototype = Iterable.prototype;
      var nativeIterator = IterablePrototype[ITERATOR$5]
        || IterablePrototype['@@iterator']
        || DEFAULT && IterablePrototype[DEFAULT];
      var defaultIterator = !BUGGY_SAFARI_ITERATORS && nativeIterator || getIterationMethod(DEFAULT);
      var anyNativeIterator = NAME == 'Array' ? IterablePrototype.entries || nativeIterator : nativeIterator;
      var CurrentIteratorPrototype, methods, KEY;

      // fix native
      if (anyNativeIterator) {
        CurrentIteratorPrototype = objectGetPrototypeOf(anyNativeIterator.call(new Iterable()));
        if (CurrentIteratorPrototype !== Object.prototype && CurrentIteratorPrototype.next) {
          if (objectGetPrototypeOf(CurrentIteratorPrototype) !== IteratorPrototype) {
            if (objectSetPrototypeOf) {
              objectSetPrototypeOf(CurrentIteratorPrototype, IteratorPrototype);
            } else if (!isCallable(CurrentIteratorPrototype[ITERATOR$5])) {
              redefine(CurrentIteratorPrototype, ITERATOR$5, returnThis);
            }
          }
          // Set @@toStringTag to native iterators
          setToStringTag(CurrentIteratorPrototype, TO_STRING_TAG, true);
        }
      }

      // fix Array.prototype.{ values, @@iterator }.name in V8 / FF
      if (PROPER_FUNCTION_NAME && DEFAULT == VALUES && nativeIterator && nativeIterator.name !== VALUES) {
        if (CONFIGURABLE_FUNCTION_NAME) {
          createNonEnumerableProperty(IterablePrototype, 'name', VALUES);
        } else {
          INCORRECT_VALUES_NAME = true;
          defaultIterator = function values() { return functionCall(nativeIterator, this); };
        }
      }

      // export additional methods
      if (DEFAULT) {
        methods = {
          values: getIterationMethod(VALUES),
          keys: IS_SET ? defaultIterator : getIterationMethod(KEYS),
          entries: getIterationMethod(ENTRIES)
        };
        if (FORCED) for (KEY in methods) {
          if (BUGGY_SAFARI_ITERATORS || INCORRECT_VALUES_NAME || !(KEY in IterablePrototype)) {
            redefine(IterablePrototype, KEY, methods[KEY]);
          }
        } else _export({ target: NAME, proto: true, forced: BUGGY_SAFARI_ITERATORS || INCORRECT_VALUES_NAME }, methods);
      }

      // define iterator
      if (IterablePrototype[ITERATOR$5] !== defaultIterator) {
        redefine(IterablePrototype, ITERATOR$5, defaultIterator, { name: DEFAULT });
      }
      iterators[NAME] = defaultIterator;

      return methods;
    };

    var defineProperty$2 = objectDefineProperty.f;




    var ARRAY_ITERATOR = 'Array Iterator';
    var setInternalState$2 = internalState.set;
    var getInternalState$2 = internalState.getterFor(ARRAY_ITERATOR);

    // `Array.prototype.entries` method
    // https://tc39.es/ecma262/#sec-array.prototype.entries
    // `Array.prototype.keys` method
    // https://tc39.es/ecma262/#sec-array.prototype.keys
    // `Array.prototype.values` method
    // https://tc39.es/ecma262/#sec-array.prototype.values
    // `Array.prototype[@@iterator]` method
    // https://tc39.es/ecma262/#sec-array.prototype-@@iterator
    // `CreateArrayIterator` internal method
    // https://tc39.es/ecma262/#sec-createarrayiterator
    var es_array_iterator = defineIterator(Array, 'Array', function (iterated, kind) {
      setInternalState$2(this, {
        type: ARRAY_ITERATOR,
        target: toIndexedObject(iterated), // target
        index: 0,                          // next index
        kind: kind                         // kind
      });
    // `%ArrayIteratorPrototype%.next` method
    // https://tc39.es/ecma262/#sec-%arrayiteratorprototype%.next
    }, function () {
      var state = getInternalState$2(this);
      var target = state.target;
      var kind = state.kind;
      var index = state.index++;
      if (!target || index >= target.length) {
        state.target = undefined;
        return { value: undefined, done: true };
      }
      if (kind == 'keys') return { value: index, done: false };
      if (kind == 'values') return { value: target[index], done: false };
      return { value: [index, target[index]], done: false };
    }, 'values');

    // argumentsList[@@iterator] is %ArrayProto_values%
    // https://tc39.es/ecma262/#sec-createunmappedargumentsobject
    // https://tc39.es/ecma262/#sec-createmappedargumentsobject
    var values = iterators.Arguments = iterators.Array;

    // https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
    addToUnscopables('keys');
    addToUnscopables('values');
    addToUnscopables('entries');

    // V8 ~ Chrome 45- bug
    if (descriptors && values.name !== 'values') try {
      defineProperty$2(values, 'name', { value: 'values' });
    } catch (error) { /* empty */ }

    // eslint-disable-next-line es/no-object-assign -- safe
    var $assign = Object.assign;
    // eslint-disable-next-line es/no-object-defineproperty -- required for testing
    var defineProperty$1 = Object.defineProperty;
    var concat$1 = functionUncurryThis([].concat);

    // `Object.assign` method
    // https://tc39.es/ecma262/#sec-object.assign
    var objectAssign = !$assign || fails(function () {
      // should have correct order of operations (Edge bug)
      if (descriptors && $assign({ b: 1 }, $assign(defineProperty$1({}, 'a', {
        enumerable: true,
        get: function () {
          defineProperty$1(this, 'b', {
            value: 3,
            enumerable: false
          });
        }
      }), { b: 2 })).b !== 1) return true;
      // should work with symbols and should have deterministic property order (V8 bug)
      var A = {};
      var B = {};
      // eslint-disable-next-line es/no-symbol -- safe
      var symbol = Symbol();
      var alphabet = 'abcdefghijklmnopqrst';
      A[symbol] = 7;
      alphabet.split('').forEach(function (chr) { B[chr] = chr; });
      return $assign({}, A)[symbol] != 7 || objectKeys($assign({}, B)).join('') != alphabet;
    }) ? function assign(target, source) { // eslint-disable-line no-unused-vars -- required for `.length`
      var T = toObject(target);
      var argumentsLength = arguments.length;
      var index = 1;
      var getOwnPropertySymbols = objectGetOwnPropertySymbols.f;
      var propertyIsEnumerable = objectPropertyIsEnumerable.f;
      while (argumentsLength > index) {
        var S = indexedObject(arguments[index++]);
        var keys = getOwnPropertySymbols ? concat$1(objectKeys(S), getOwnPropertySymbols(S)) : objectKeys(S);
        var length = keys.length;
        var j = 0;
        var key;
        while (length > j) {
          key = keys[j++];
          if (!descriptors || functionCall(propertyIsEnumerable, S, key)) T[key] = S[key];
        }
      } return T;
    } : $assign;

    // `Object.assign` method
    // https://tc39.es/ecma262/#sec-object.assign
    // eslint-disable-next-line es/no-object-assign -- required for testing
    _export({ target: 'Object', stat: true, forced: Object.assign !== objectAssign }, {
      assign: objectAssign
    });

    // `Object.prototype.toString` method implementation
    // https://tc39.es/ecma262/#sec-object.prototype.tostring
    var objectToString$3 = toStringTagSupport ? {}.toString : function toString() {
      return '[object ' + classof(this) + ']';
    };

    // `Object.prototype.toString` method
    // https://tc39.es/ecma262/#sec-object.prototype.tostring
    if (!toStringTagSupport) {
      redefine(Object.prototype, 'toString', objectToString$3, { unsafe: true });
    }

    var String$1 = global$2.String;

    var toString = function (argument) {
      if (classof(argument) === 'Symbol') throw TypeError('Cannot convert a Symbol value to a string');
      return String$1(argument);
    };

    // a string of all valid unicode whitespaces
    var whitespaces = '\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u2000\u2001\u2002' +
      '\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';

    var replace$2 = functionUncurryThis(''.replace);
    var whitespace = '[' + whitespaces + ']';
    var ltrim = RegExp('^' + whitespace + whitespace + '*');
    var rtrim = RegExp(whitespace + whitespace + '*$');

    // `String.prototype.{ trim, trimStart, trimEnd, trimLeft, trimRight }` methods implementation
    var createMethod$2 = function (TYPE) {
      return function ($this) {
        var string = toString(requireObjectCoercible($this));
        if (TYPE & 1) string = replace$2(string, ltrim, '');
        if (TYPE & 2) string = replace$2(string, rtrim, '');
        return string;
      };
    };

    var stringTrim = {
      // `String.prototype.{ trimLeft, trimStart }` methods
      // https://tc39.es/ecma262/#sec-string.prototype.trimstart
      start: createMethod$2(1),
      // `String.prototype.{ trimRight, trimEnd }` methods
      // https://tc39.es/ecma262/#sec-string.prototype.trimend
      end: createMethod$2(2),
      // `String.prototype.trim` method
      // https://tc39.es/ecma262/#sec-string.prototype.trim
      trim: createMethod$2(3)
    };

    var trim = stringTrim.trim;


    var $parseInt = global$2.parseInt;
    var Symbol$1 = global$2.Symbol;
    var ITERATOR$4 = Symbol$1 && Symbol$1.iterator;
    var hex = /^[+-]?0x/i;
    var exec = functionUncurryThis(hex.exec);
    var FORCED = $parseInt(whitespaces + '08') !== 8 || $parseInt(whitespaces + '0x16') !== 22
      // MS Edge 18- broken with boxed symbols
      || (ITERATOR$4 && !fails(function () { $parseInt(Object(ITERATOR$4)); }));

    // `parseInt` method
    // https://tc39.es/ecma262/#sec-parseint-string-radix
    var numberParseInt = FORCED ? function parseInt(string, radix) {
      var S = trim(toString(string));
      return $parseInt(S, (radix >>> 0) || (exec(hex, S) ? 16 : 10));
    } : $parseInt;

    // `parseInt` method
    // https://tc39.es/ecma262/#sec-parseint-string-radix
    _export({ global: true, forced: parseInt != numberParseInt }, {
      parseInt: numberParseInt
    });

    var charAt$4 = functionUncurryThis(''.charAt);
    var charCodeAt = functionUncurryThis(''.charCodeAt);
    var stringSlice$3 = functionUncurryThis(''.slice);

    var createMethod$1 = function (CONVERT_TO_STRING) {
      return function ($this, pos) {
        var S = toString(requireObjectCoercible($this));
        var position = toIntegerOrInfinity(pos);
        var size = S.length;
        var first, second;
        if (position < 0 || position >= size) return CONVERT_TO_STRING ? '' : undefined;
        first = charCodeAt(S, position);
        return first < 0xD800 || first > 0xDBFF || position + 1 === size
          || (second = charCodeAt(S, position + 1)) < 0xDC00 || second > 0xDFFF
            ? CONVERT_TO_STRING
              ? charAt$4(S, position)
              : first
            : CONVERT_TO_STRING
              ? stringSlice$3(S, position, position + 2)
              : (first - 0xD800 << 10) + (second - 0xDC00) + 0x10000;
      };
    };

    var stringMultibyte = {
      // `String.prototype.codePointAt` method
      // https://tc39.es/ecma262/#sec-string.prototype.codepointat
      codeAt: createMethod$1(false),
      // `String.prototype.at` method
      // https://github.com/mathiasbynens/String.prototype.at
      charAt: createMethod$1(true)
    };

    var charAt$3 = stringMultibyte.charAt;




    var STRING_ITERATOR = 'String Iterator';
    var setInternalState$1 = internalState.set;
    var getInternalState$1 = internalState.getterFor(STRING_ITERATOR);

    // `String.prototype[@@iterator]` method
    // https://tc39.es/ecma262/#sec-string.prototype-@@iterator
    defineIterator(String, 'String', function (iterated) {
      setInternalState$1(this, {
        type: STRING_ITERATOR,
        string: toString(iterated),
        index: 0
      });
    // `%StringIteratorPrototype%.next` method
    // https://tc39.es/ecma262/#sec-%stringiteratorprototype%.next
    }, function next() {
      var state = getInternalState$1(this);
      var string = state.string;
      var index = state.index;
      var point;
      if (index >= string.length) return { value: undefined, done: true };
      point = charAt$3(string, index);
      state.index += point.length;
      return { value: point, done: false };
    });

    var redefineAll = function (target, src, options) {
      for (var key in src) redefine(target, key, src[key], options);
      return target;
    };

    var createProperty = function (object, key, value) {
      var propertyKey = toPropertyKey(key);
      if (propertyKey in object) objectDefineProperty.f(object, propertyKey, createPropertyDescriptor(0, value));
      else object[propertyKey] = value;
    };

    var Array$1 = global$2.Array;
    var max$1 = Math.max;

    var arraySliceSimple = function (O, start, end) {
      var length = lengthOfArrayLike(O);
      var k = toAbsoluteIndex(start, length);
      var fin = toAbsoluteIndex(end === undefined ? length : end, length);
      var result = Array$1(max$1(fin - k, 0));
      for (var n = 0; k < fin; k++, n++) createProperty(result, n, O[k]);
      result.length = n;
      return result;
    };

    /* eslint-disable es/no-object-getownpropertynames -- safe */

    var $getOwnPropertyNames = objectGetOwnPropertyNames.f;


    var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
      ? Object.getOwnPropertyNames(window) : [];

    var getWindowNames = function (it) {
      try {
        return $getOwnPropertyNames(it);
      } catch (error) {
        return arraySliceSimple(windowNames);
      }
    };

    // fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
    var f = function getOwnPropertyNames(it) {
      return windowNames && classofRaw(it) == 'Window'
        ? getWindowNames(it)
        : $getOwnPropertyNames(toIndexedObject(it));
    };

    var objectGetOwnPropertyNamesExternal = {
    	f: f
    };

    // FF26- bug: ArrayBuffers are non-extensible, but Object.isExtensible does not report it


    var arrayBufferNonExtensible = fails(function () {
      if (typeof ArrayBuffer == 'function') {
        var buffer = new ArrayBuffer(8);
        // eslint-disable-next-line es/no-object-isextensible, es/no-object-defineproperty -- safe
        if (Object.isExtensible(buffer)) Object.defineProperty(buffer, 'a', { value: 8 });
      }
    });

    // eslint-disable-next-line es/no-object-isextensible -- safe
    var $isExtensible = Object.isExtensible;
    var FAILS_ON_PRIMITIVES = fails(function () { $isExtensible(1); });

    // `Object.isExtensible` method
    // https://tc39.es/ecma262/#sec-object.isextensible
    var objectIsExtensible = (FAILS_ON_PRIMITIVES || arrayBufferNonExtensible) ? function isExtensible(it) {
      if (!isObject$3(it)) return false;
      if (arrayBufferNonExtensible && classofRaw(it) == 'ArrayBuffer') return false;
      return $isExtensible ? $isExtensible(it) : true;
    } : $isExtensible;

    var freezing = !fails(function () {
      // eslint-disable-next-line es/no-object-isextensible, es/no-object-preventextensions -- required for testing
      return Object.isExtensible(Object.preventExtensions({}));
    });

    var internalMetadata = createCommonjsModule(function (module) {
    var defineProperty = objectDefineProperty.f;






    var REQUIRED = false;
    var METADATA = uid('meta');
    var id = 0;

    var setMetadata = function (it) {
      defineProperty(it, METADATA, { value: {
        objectID: 'O' + id++, // object ID
        weakData: {}          // weak collections IDs
      } });
    };

    var fastKey = function (it, create) {
      // return a primitive with prefix
      if (!isObject$3(it)) return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
      if (!hasOwnProperty_1(it, METADATA)) {
        // can't set metadata to uncaught frozen object
        if (!objectIsExtensible(it)) return 'F';
        // not necessary to add metadata
        if (!create) return 'E';
        // add missing metadata
        setMetadata(it);
      // return object ID
      } return it[METADATA].objectID;
    };

    var getWeakData = function (it, create) {
      if (!hasOwnProperty_1(it, METADATA)) {
        // can't set metadata to uncaught frozen object
        if (!objectIsExtensible(it)) return true;
        // not necessary to add metadata
        if (!create) return false;
        // add missing metadata
        setMetadata(it);
      // return the store of weak collections IDs
      } return it[METADATA].weakData;
    };

    // add metadata on freeze-family methods calling
    var onFreeze = function (it) {
      if (freezing && REQUIRED && objectIsExtensible(it) && !hasOwnProperty_1(it, METADATA)) setMetadata(it);
      return it;
    };

    var enable = function () {
      meta.enable = function () { /* empty */ };
      REQUIRED = true;
      var getOwnPropertyNames = objectGetOwnPropertyNames.f;
      var splice = functionUncurryThis([].splice);
      var test = {};
      test[METADATA] = 1;

      // prevent exposing of metadata key
      if (getOwnPropertyNames(test).length) {
        objectGetOwnPropertyNames.f = function (it) {
          var result = getOwnPropertyNames(it);
          for (var i = 0, length = result.length; i < length; i++) {
            if (result[i] === METADATA) {
              splice(result, i, 1);
              break;
            }
          } return result;
        };

        _export({ target: 'Object', stat: true, forced: true }, {
          getOwnPropertyNames: objectGetOwnPropertyNamesExternal.f
        });
      }
    };

    var meta = module.exports = {
      enable: enable,
      fastKey: fastKey,
      getWeakData: getWeakData,
      onFreeze: onFreeze
    };

    hiddenKeys$1[METADATA] = true;
    });

    var ITERATOR$3 = wellKnownSymbol('iterator');
    var ArrayPrototype = Array.prototype;

    // check on default Array iterator
    var isArrayIteratorMethod = function (it) {
      return it !== undefined && (iterators.Array === it || ArrayPrototype[ITERATOR$3] === it);
    };

    var ITERATOR$2 = wellKnownSymbol('iterator');

    var getIteratorMethod = function (it) {
      if (it != undefined) return getMethod(it, ITERATOR$2)
        || getMethod(it, '@@iterator')
        || iterators[classof(it)];
    };

    var TypeError$5 = global$2.TypeError;

    var getIterator = function (argument, usingIterator) {
      var iteratorMethod = arguments.length < 2 ? getIteratorMethod(argument) : usingIterator;
      if (aCallable(iteratorMethod)) return anObject(functionCall(iteratorMethod, argument));
      throw TypeError$5(tryToString(argument) + ' is not iterable');
    };

    var iteratorClose = function (iterator, kind, value) {
      var innerResult, innerError;
      anObject(iterator);
      try {
        innerResult = getMethod(iterator, 'return');
        if (!innerResult) {
          if (kind === 'throw') throw value;
          return value;
        }
        innerResult = functionCall(innerResult, iterator);
      } catch (error) {
        innerError = true;
        innerResult = error;
      }
      if (kind === 'throw') throw value;
      if (innerError) throw innerResult;
      anObject(innerResult);
      return value;
    };

    var TypeError$4 = global$2.TypeError;

    var Result = function (stopped, result) {
      this.stopped = stopped;
      this.result = result;
    };

    var ResultPrototype = Result.prototype;

    var iterate = function (iterable, unboundFunction, options) {
      var that = options && options.that;
      var AS_ENTRIES = !!(options && options.AS_ENTRIES);
      var IS_ITERATOR = !!(options && options.IS_ITERATOR);
      var INTERRUPTED = !!(options && options.INTERRUPTED);
      var fn = functionBindContext(unboundFunction, that);
      var iterator, iterFn, index, length, result, next, step;

      var stop = function (condition) {
        if (iterator) iteratorClose(iterator, 'normal', condition);
        return new Result(true, condition);
      };

      var callFn = function (value) {
        if (AS_ENTRIES) {
          anObject(value);
          return INTERRUPTED ? fn(value[0], value[1], stop) : fn(value[0], value[1]);
        } return INTERRUPTED ? fn(value, stop) : fn(value);
      };

      if (IS_ITERATOR) {
        iterator = iterable;
      } else {
        iterFn = getIteratorMethod(iterable);
        if (!iterFn) throw TypeError$4(tryToString(iterable) + ' is not iterable');
        // optimisation for array iterators
        if (isArrayIteratorMethod(iterFn)) {
          for (index = 0, length = lengthOfArrayLike(iterable); length > index; index++) {
            result = callFn(iterable[index]);
            if (result && objectIsPrototypeOf(ResultPrototype, result)) return result;
          } return new Result(false);
        }
        iterator = getIterator(iterable, iterFn);
      }

      next = iterator.next;
      while (!(step = functionCall(next, iterator)).done) {
        try {
          result = callFn(step.value);
        } catch (error) {
          iteratorClose(iterator, 'throw', error);
        }
        if (typeof result == 'object' && result && objectIsPrototypeOf(ResultPrototype, result)) return result;
      } return new Result(false);
    };

    var TypeError$3 = global$2.TypeError;

    var anInstance = function (it, Prototype) {
      if (objectIsPrototypeOf(Prototype, it)) return it;
      throw TypeError$3('Incorrect invocation');
    };

    var ITERATOR$1 = wellKnownSymbol('iterator');
    var SAFE_CLOSING = false;

    try {
      var called = 0;
      var iteratorWithReturn = {
        next: function () {
          return { done: !!called++ };
        },
        'return': function () {
          SAFE_CLOSING = true;
        }
      };
      iteratorWithReturn[ITERATOR$1] = function () {
        return this;
      };
      // eslint-disable-next-line es/no-array-from, no-throw-literal -- required for testing
      Array.from(iteratorWithReturn, function () { throw 2; });
    } catch (error) { /* empty */ }

    var checkCorrectnessOfIteration = function (exec, SKIP_CLOSING) {
      if (!SKIP_CLOSING && !SAFE_CLOSING) return false;
      var ITERATION_SUPPORT = false;
      try {
        var object = {};
        object[ITERATOR$1] = function () {
          return {
            next: function () {
              return { done: ITERATION_SUPPORT = true };
            }
          };
        };
        exec(object);
      } catch (error) { /* empty */ }
      return ITERATION_SUPPORT;
    };

    // makes subclassing work correct for wrapped built-ins
    var inheritIfRequired = function ($this, dummy, Wrapper) {
      var NewTarget, NewTargetPrototype;
      if (
        // it can work only with native `setPrototypeOf`
        objectSetPrototypeOf &&
        // we haven't completely correct pre-ES6 way for getting `new.target`, so use this
        isCallable(NewTarget = dummy.constructor) &&
        NewTarget !== Wrapper &&
        isObject$3(NewTargetPrototype = NewTarget.prototype) &&
        NewTargetPrototype !== Wrapper.prototype
      ) objectSetPrototypeOf($this, NewTargetPrototype);
      return $this;
    };

    var collection = function (CONSTRUCTOR_NAME, wrapper, common) {
      var IS_MAP = CONSTRUCTOR_NAME.indexOf('Map') !== -1;
      var IS_WEAK = CONSTRUCTOR_NAME.indexOf('Weak') !== -1;
      var ADDER = IS_MAP ? 'set' : 'add';
      var NativeConstructor = global$2[CONSTRUCTOR_NAME];
      var NativePrototype = NativeConstructor && NativeConstructor.prototype;
      var Constructor = NativeConstructor;
      var exported = {};

      var fixMethod = function (KEY) {
        var uncurriedNativeMethod = functionUncurryThis(NativePrototype[KEY]);
        redefine(NativePrototype, KEY,
          KEY == 'add' ? function add(value) {
            uncurriedNativeMethod(this, value === 0 ? 0 : value);
            return this;
          } : KEY == 'delete' ? function (key) {
            return IS_WEAK && !isObject$3(key) ? false : uncurriedNativeMethod(this, key === 0 ? 0 : key);
          } : KEY == 'get' ? function get(key) {
            return IS_WEAK && !isObject$3(key) ? undefined : uncurriedNativeMethod(this, key === 0 ? 0 : key);
          } : KEY == 'has' ? function has(key) {
            return IS_WEAK && !isObject$3(key) ? false : uncurriedNativeMethod(this, key === 0 ? 0 : key);
          } : function set(key, value) {
            uncurriedNativeMethod(this, key === 0 ? 0 : key, value);
            return this;
          }
        );
      };

      var REPLACE = isForced_1(
        CONSTRUCTOR_NAME,
        !isCallable(NativeConstructor) || !(IS_WEAK || NativePrototype.forEach && !fails(function () {
          new NativeConstructor().entries().next();
        }))
      );

      if (REPLACE) {
        // create collection constructor
        Constructor = common.getConstructor(wrapper, CONSTRUCTOR_NAME, IS_MAP, ADDER);
        internalMetadata.enable();
      } else if (isForced_1(CONSTRUCTOR_NAME, true)) {
        var instance = new Constructor();
        // early implementations not supports chaining
        var HASNT_CHAINING = instance[ADDER](IS_WEAK ? {} : -0, 1) != instance;
        // V8 ~ Chromium 40- weak-collections throws on primitives, but should return false
        var THROWS_ON_PRIMITIVES = fails(function () { instance.has(1); });
        // most early implementations doesn't supports iterables, most modern - not close it correctly
        // eslint-disable-next-line no-new -- required for testing
        var ACCEPT_ITERABLES = checkCorrectnessOfIteration(function (iterable) { new NativeConstructor(iterable); });
        // for early implementations -0 and +0 not the same
        var BUGGY_ZERO = !IS_WEAK && fails(function () {
          // V8 ~ Chromium 42- fails only with 5+ elements
          var $instance = new NativeConstructor();
          var index = 5;
          while (index--) $instance[ADDER](index, index);
          return !$instance.has(-0);
        });

        if (!ACCEPT_ITERABLES) {
          Constructor = wrapper(function (dummy, iterable) {
            anInstance(dummy, NativePrototype);
            var that = inheritIfRequired(new NativeConstructor(), dummy, Constructor);
            if (iterable != undefined) iterate(iterable, that[ADDER], { that: that, AS_ENTRIES: IS_MAP });
            return that;
          });
          Constructor.prototype = NativePrototype;
          NativePrototype.constructor = Constructor;
        }

        if (THROWS_ON_PRIMITIVES || BUGGY_ZERO) {
          fixMethod('delete');
          fixMethod('has');
          IS_MAP && fixMethod('get');
        }

        if (BUGGY_ZERO || HASNT_CHAINING) fixMethod(ADDER);

        // weak collections should not contains .clear method
        if (IS_WEAK && NativePrototype.clear) delete NativePrototype.clear;
      }

      exported[CONSTRUCTOR_NAME] = Constructor;
      _export({ global: true, forced: Constructor != NativeConstructor }, exported);

      setToStringTag(Constructor, CONSTRUCTOR_NAME);

      if (!IS_WEAK) common.setStrong(Constructor, CONSTRUCTOR_NAME, IS_MAP);

      return Constructor;
    };

    var getWeakData = internalMetadata.getWeakData;








    var setInternalState = internalState.set;
    var internalStateGetterFor = internalState.getterFor;
    var find = arrayIteration.find;
    var findIndex = arrayIteration.findIndex;
    var splice$1 = functionUncurryThis([].splice);
    var id = 0;

    // fallback for uncaught frozen keys
    var uncaughtFrozenStore = function (store) {
      return store.frozen || (store.frozen = new UncaughtFrozenStore());
    };

    var UncaughtFrozenStore = function () {
      this.entries = [];
    };

    var findUncaughtFrozen = function (store, key) {
      return find(store.entries, function (it) {
        return it[0] === key;
      });
    };

    UncaughtFrozenStore.prototype = {
      get: function (key) {
        var entry = findUncaughtFrozen(this, key);
        if (entry) return entry[1];
      },
      has: function (key) {
        return !!findUncaughtFrozen(this, key);
      },
      set: function (key, value) {
        var entry = findUncaughtFrozen(this, key);
        if (entry) entry[1] = value;
        else this.entries.push([key, value]);
      },
      'delete': function (key) {
        var index = findIndex(this.entries, function (it) {
          return it[0] === key;
        });
        if (~index) splice$1(this.entries, index, 1);
        return !!~index;
      }
    };

    var collectionWeak = {
      getConstructor: function (wrapper, CONSTRUCTOR_NAME, IS_MAP, ADDER) {
        var Constructor = wrapper(function (that, iterable) {
          anInstance(that, Prototype);
          setInternalState(that, {
            type: CONSTRUCTOR_NAME,
            id: id++,
            frozen: undefined
          });
          if (iterable != undefined) iterate(iterable, that[ADDER], { that: that, AS_ENTRIES: IS_MAP });
        });

        var Prototype = Constructor.prototype;

        var getInternalState = internalStateGetterFor(CONSTRUCTOR_NAME);

        var define = function (that, key, value) {
          var state = getInternalState(that);
          var data = getWeakData(anObject(key), true);
          if (data === true) uncaughtFrozenStore(state).set(key, value);
          else data[state.id] = value;
          return that;
        };

        redefineAll(Prototype, {
          // `{ WeakMap, WeakSet }.prototype.delete(key)` methods
          // https://tc39.es/ecma262/#sec-weakmap.prototype.delete
          // https://tc39.es/ecma262/#sec-weakset.prototype.delete
          'delete': function (key) {
            var state = getInternalState(this);
            if (!isObject$3(key)) return false;
            var data = getWeakData(key);
            if (data === true) return uncaughtFrozenStore(state)['delete'](key);
            return data && hasOwnProperty_1(data, state.id) && delete data[state.id];
          },
          // `{ WeakMap, WeakSet }.prototype.has(key)` methods
          // https://tc39.es/ecma262/#sec-weakmap.prototype.has
          // https://tc39.es/ecma262/#sec-weakset.prototype.has
          has: function has(key) {
            var state = getInternalState(this);
            if (!isObject$3(key)) return false;
            var data = getWeakData(key);
            if (data === true) return uncaughtFrozenStore(state).has(key);
            return data && hasOwnProperty_1(data, state.id);
          }
        });

        redefineAll(Prototype, IS_MAP ? {
          // `WeakMap.prototype.get(key)` method
          // https://tc39.es/ecma262/#sec-weakmap.prototype.get
          get: function get(key) {
            var state = getInternalState(this);
            if (isObject$3(key)) {
              var data = getWeakData(key);
              if (data === true) return uncaughtFrozenStore(state).get(key);
              return data ? data[state.id] : undefined;
            }
          },
          // `WeakMap.prototype.set(key, value)` method
          // https://tc39.es/ecma262/#sec-weakmap.prototype.set
          set: function set(key, value) {
            return define(this, key, value);
          }
        } : {
          // `WeakSet.prototype.add(value)` method
          // https://tc39.es/ecma262/#sec-weakset.prototype.add
          add: function add(value) {
            return define(this, value, true);
          }
        });

        return Constructor;
      }
    };

    var enforceIternalState = internalState.enforce;


    var IS_IE11 = !global$2.ActiveXObject && 'ActiveXObject' in global$2;
    var InternalWeakMap;

    var wrapper = function (init) {
      return function WeakMap() {
        return init(this, arguments.length ? arguments[0] : undefined);
      };
    };

    // `WeakMap` constructor
    // https://tc39.es/ecma262/#sec-weakmap-constructor
    var $WeakMap = collection('WeakMap', wrapper, collectionWeak);

    // IE11 WeakMap frozen keys fix
    // We can't use feature detection because it crash some old IE builds
    // https://github.com/zloirock/core-js/issues/485
    if (nativeWeakMap && IS_IE11) {
      InternalWeakMap = collectionWeak.getConstructor(wrapper, 'WeakMap', true);
      internalMetadata.enable();
      var WeakMapPrototype = $WeakMap.prototype;
      var nativeDelete = functionUncurryThis(WeakMapPrototype['delete']);
      var nativeHas = functionUncurryThis(WeakMapPrototype.has);
      var nativeGet = functionUncurryThis(WeakMapPrototype.get);
      var nativeSet = functionUncurryThis(WeakMapPrototype.set);
      redefineAll(WeakMapPrototype, {
        'delete': function (key) {
          if (isObject$3(key) && !objectIsExtensible(key)) {
            var state = enforceIternalState(this);
            if (!state.frozen) state.frozen = new InternalWeakMap();
            return nativeDelete(this, key) || state.frozen['delete'](key);
          } return nativeDelete(this, key);
        },
        has: function has(key) {
          if (isObject$3(key) && !objectIsExtensible(key)) {
            var state = enforceIternalState(this);
            if (!state.frozen) state.frozen = new InternalWeakMap();
            return nativeHas(this, key) || state.frozen.has(key);
          } return nativeHas(this, key);
        },
        get: function get(key) {
          if (isObject$3(key) && !objectIsExtensible(key)) {
            var state = enforceIternalState(this);
            if (!state.frozen) state.frozen = new InternalWeakMap();
            return nativeHas(this, key) ? nativeGet(this, key) : state.frozen.get(key);
          } return nativeGet(this, key);
        },
        set: function set(key, value) {
          if (isObject$3(key) && !objectIsExtensible(key)) {
            var state = enforceIternalState(this);
            if (!state.frozen) state.frozen = new InternalWeakMap();
            nativeHas(this, key) ? nativeSet(this, key, value) : state.frozen.set(key, value);
          } else nativeSet(this, key, value);
          return this;
        }
      });
    }

    var ITERATOR = wellKnownSymbol('iterator');
    var TO_STRING_TAG = wellKnownSymbol('toStringTag');
    var ArrayValues = es_array_iterator.values;

    var handlePrototype = function (CollectionPrototype, COLLECTION_NAME) {
      if (CollectionPrototype) {
        // some Chrome versions have non-configurable methods on DOMTokenList
        if (CollectionPrototype[ITERATOR] !== ArrayValues) try {
          createNonEnumerableProperty(CollectionPrototype, ITERATOR, ArrayValues);
        } catch (error) {
          CollectionPrototype[ITERATOR] = ArrayValues;
        }
        if (!CollectionPrototype[TO_STRING_TAG]) {
          createNonEnumerableProperty(CollectionPrototype, TO_STRING_TAG, COLLECTION_NAME);
        }
        if (domIterables[COLLECTION_NAME]) for (var METHOD_NAME in es_array_iterator) {
          // some Chrome versions have non-configurable methods on DOMTokenList
          if (CollectionPrototype[METHOD_NAME] !== es_array_iterator[METHOD_NAME]) try {
            createNonEnumerableProperty(CollectionPrototype, METHOD_NAME, es_array_iterator[METHOD_NAME]);
          } catch (error) {
            CollectionPrototype[METHOD_NAME] = es_array_iterator[METHOD_NAME];
          }
        }
      }
    };

    for (var COLLECTION_NAME in domIterables) {
      handlePrototype(global$2[COLLECTION_NAME] && global$2[COLLECTION_NAME].prototype, COLLECTION_NAME);
    }

    handlePrototype(domTokenListPrototype, 'DOMTokenList');

    /**
     * lodash (Custom Build) <https://lodash.com/>
     * Build: `lodash modularize exports="npm" -o ./`
     * Copyright jQuery Foundation and other contributors <https://jquery.org/>
     * Released under MIT license <https://lodash.com/license>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     */

    /** Used as the `TypeError` message for "Functions" methods. */
    var FUNC_ERROR_TEXT$2 = 'Expected a function';

    /** Used as references for various `Number` constants. */
    var NAN$1 = 0 / 0;

    /** `Object#toString` result references. */
    var symbolTag$1 = '[object Symbol]';

    /** Used to match leading and trailing whitespace. */
    var reTrim$1 = /^\s+|\s+$/g;

    /** Used to detect bad signed hexadecimal string values. */
    var reIsBadHex$1 = /^[-+]0x[0-9a-f]+$/i;

    /** Used to detect binary string values. */
    var reIsBinary$1 = /^0b[01]+$/i;

    /** Used to detect octal string values. */
    var reIsOctal$1 = /^0o[0-7]+$/i;

    /** Built-in method references without a dependency on `root`. */
    var freeParseInt$1 = parseInt;

    /** Detect free variable `global` from Node.js. */
    var freeGlobal$2 = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

    /** Detect free variable `self`. */
    var freeSelf$2 = typeof self == 'object' && self && self.Object === Object && self;

    /** Used as a reference to the global object. */
    var root$2 = freeGlobal$2 || freeSelf$2 || Function('return this')();

    /** Used for built-in method references. */
    var objectProto$2 = Object.prototype;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString$2 = objectProto$2.toString;

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeMax$1 = Math.max,
        nativeMin$1 = Math.min;

    /**
     * Gets the timestamp of the number of milliseconds that have elapsed since
     * the Unix epoch (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @since 2.4.0
     * @category Date
     * @returns {number} Returns the timestamp.
     * @example
     *
     * _.defer(function(stamp) {
     *   console.log(_.now() - stamp);
     * }, _.now());
     * // => Logs the number of milliseconds it took for the deferred invocation.
     */
    var now$1 = function() {
      return root$2.Date.now();
    };

    /**
     * Creates a debounced function that delays invoking `func` until after `wait`
     * milliseconds have elapsed since the last time the debounced function was
     * invoked. The debounced function comes with a `cancel` method to cancel
     * delayed `func` invocations and a `flush` method to immediately invoke them.
     * Provide `options` to indicate whether `func` should be invoked on the
     * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
     * with the last arguments provided to the debounced function. Subsequent
     * calls to the debounced function return the result of the last `func`
     * invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is
     * invoked on the trailing edge of the timeout only if the debounced function
     * is invoked more than once during the `wait` timeout.
     *
     * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
     * until to the next tick, similar to `setTimeout` with a timeout of `0`.
     *
     * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
     * for details over the differences between `_.debounce` and `_.throttle`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to debounce.
     * @param {number} [wait=0] The number of milliseconds to delay.
     * @param {Object} [options={}] The options object.
     * @param {boolean} [options.leading=false]
     *  Specify invoking on the leading edge of the timeout.
     * @param {number} [options.maxWait]
     *  The maximum time `func` is allowed to be delayed before it's invoked.
     * @param {boolean} [options.trailing=true]
     *  Specify invoking on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // Avoid costly calculations while the window size is in flux.
     * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
     *
     * // Invoke `sendMail` when clicked, debouncing subsequent calls.
     * jQuery(element).on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * }));
     *
     * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
     * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
     * var source = new EventSource('/stream');
     * jQuery(source).on('message', debounced);
     *
     * // Cancel the trailing debounced invocation.
     * jQuery(window).on('popstate', debounced.cancel);
     */
    function debounce$1(func, wait, options) {
      var lastArgs,
          lastThis,
          maxWait,
          result,
          timerId,
          lastCallTime,
          lastInvokeTime = 0,
          leading = false,
          maxing = false,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT$2);
      }
      wait = toNumber$1(wait) || 0;
      if (isObject$2(options)) {
        leading = !!options.leading;
        maxing = 'maxWait' in options;
        maxWait = maxing ? nativeMax$1(toNumber$1(options.maxWait) || 0, wait) : maxWait;
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }

      function invokeFunc(time) {
        var args = lastArgs,
            thisArg = lastThis;

        lastArgs = lastThis = undefined;
        lastInvokeTime = time;
        result = func.apply(thisArg, args);
        return result;
      }

      function leadingEdge(time) {
        // Reset any `maxWait` timer.
        lastInvokeTime = time;
        // Start the timer for the trailing edge.
        timerId = setTimeout(timerExpired, wait);
        // Invoke the leading edge.
        return leading ? invokeFunc(time) : result;
      }

      function remainingWait(time) {
        var timeSinceLastCall = time - lastCallTime,
            timeSinceLastInvoke = time - lastInvokeTime,
            result = wait - timeSinceLastCall;

        return maxing ? nativeMin$1(result, maxWait - timeSinceLastInvoke) : result;
      }

      function shouldInvoke(time) {
        var timeSinceLastCall = time - lastCallTime,
            timeSinceLastInvoke = time - lastInvokeTime;

        // Either this is the first call, activity has stopped and we're at the
        // trailing edge, the system time has gone backwards and we're treating
        // it as the trailing edge, or we've hit the `maxWait` limit.
        return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
          (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
      }

      function timerExpired() {
        var time = now$1();
        if (shouldInvoke(time)) {
          return trailingEdge(time);
        }
        // Restart the timer.
        timerId = setTimeout(timerExpired, remainingWait(time));
      }

      function trailingEdge(time) {
        timerId = undefined;

        // Only invoke if we have `lastArgs` which means `func` has been
        // debounced at least once.
        if (trailing && lastArgs) {
          return invokeFunc(time);
        }
        lastArgs = lastThis = undefined;
        return result;
      }

      function cancel() {
        if (timerId !== undefined) {
          clearTimeout(timerId);
        }
        lastInvokeTime = 0;
        lastArgs = lastCallTime = lastThis = timerId = undefined;
      }

      function flush() {
        return timerId === undefined ? result : trailingEdge(now$1());
      }

      function debounced() {
        var time = now$1(),
            isInvoking = shouldInvoke(time);

        lastArgs = arguments;
        lastThis = this;
        lastCallTime = time;

        if (isInvoking) {
          if (timerId === undefined) {
            return leadingEdge(lastCallTime);
          }
          if (maxing) {
            // Handle invocations in a tight loop.
            timerId = setTimeout(timerExpired, wait);
            return invokeFunc(lastCallTime);
          }
        }
        if (timerId === undefined) {
          timerId = setTimeout(timerExpired, wait);
        }
        return result;
      }
      debounced.cancel = cancel;
      debounced.flush = flush;
      return debounced;
    }

    /**
     * Creates a throttled function that only invokes `func` at most once per
     * every `wait` milliseconds. The throttled function comes with a `cancel`
     * method to cancel delayed `func` invocations and a `flush` method to
     * immediately invoke them. Provide `options` to indicate whether `func`
     * should be invoked on the leading and/or trailing edge of the `wait`
     * timeout. The `func` is invoked with the last arguments provided to the
     * throttled function. Subsequent calls to the throttled function return the
     * result of the last `func` invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is
     * invoked on the trailing edge of the timeout only if the throttled function
     * is invoked more than once during the `wait` timeout.
     *
     * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
     * until to the next tick, similar to `setTimeout` with a timeout of `0`.
     *
     * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
     * for details over the differences between `_.throttle` and `_.debounce`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to throttle.
     * @param {number} [wait=0] The number of milliseconds to throttle invocations to.
     * @param {Object} [options={}] The options object.
     * @param {boolean} [options.leading=true]
     *  Specify invoking on the leading edge of the timeout.
     * @param {boolean} [options.trailing=true]
     *  Specify invoking on the trailing edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // Avoid excessively updating the position while scrolling.
     * jQuery(window).on('scroll', _.throttle(updatePosition, 100));
     *
     * // Invoke `renewToken` when the click event is fired, but not more than once every 5 minutes.
     * var throttled = _.throttle(renewToken, 300000, { 'trailing': false });
     * jQuery(element).on('click', throttled);
     *
     * // Cancel the trailing throttled invocation.
     * jQuery(window).on('popstate', throttled.cancel);
     */
    function throttle(func, wait, options) {
      var leading = true,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT$2);
      }
      if (isObject$2(options)) {
        leading = 'leading' in options ? !!options.leading : leading;
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }
      return debounce$1(func, wait, {
        'leading': leading,
        'maxWait': wait,
        'trailing': trailing
      });
    }

    /**
     * Checks if `value` is the
     * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
     * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(_.noop);
     * // => true
     *
     * _.isObject(null);
     * // => false
     */
    function isObject$2(value) {
      var type = typeof value;
      return !!value && (type == 'object' || type == 'function');
    }

    /**
     * Checks if `value` is object-like. A value is object-like if it's not `null`
     * and has a `typeof` result of "object".
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     * @example
     *
     * _.isObjectLike({});
     * // => true
     *
     * _.isObjectLike([1, 2, 3]);
     * // => true
     *
     * _.isObjectLike(_.noop);
     * // => false
     *
     * _.isObjectLike(null);
     * // => false
     */
    function isObjectLike$1(value) {
      return !!value && typeof value == 'object';
    }

    /**
     * Checks if `value` is classified as a `Symbol` primitive or object.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
     * @example
     *
     * _.isSymbol(Symbol.iterator);
     * // => true
     *
     * _.isSymbol('abc');
     * // => false
     */
    function isSymbol$1(value) {
      return typeof value == 'symbol' ||
        (isObjectLike$1(value) && objectToString$2.call(value) == symbolTag$1);
    }

    /**
     * Converts `value` to a number.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to process.
     * @returns {number} Returns the number.
     * @example
     *
     * _.toNumber(3.2);
     * // => 3.2
     *
     * _.toNumber(Number.MIN_VALUE);
     * // => 5e-324
     *
     * _.toNumber(Infinity);
     * // => Infinity
     *
     * _.toNumber('3.2');
     * // => 3.2
     */
    function toNumber$1(value) {
      if (typeof value == 'number') {
        return value;
      }
      if (isSymbol$1(value)) {
        return NAN$1;
      }
      if (isObject$2(value)) {
        var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
        value = isObject$2(other) ? (other + '') : other;
      }
      if (typeof value != 'string') {
        return value === 0 ? value : +value;
      }
      value = value.replace(reTrim$1, '');
      var isBinary = reIsBinary$1.test(value);
      return (isBinary || reIsOctal$1.test(value))
        ? freeParseInt$1(value.slice(2), isBinary ? 2 : 8)
        : (reIsBadHex$1.test(value) ? NAN$1 : +value);
    }

    var lodash_throttle = throttle;

    /**
     * lodash (Custom Build) <https://lodash.com/>
     * Build: `lodash modularize exports="npm" -o ./`
     * Copyright jQuery Foundation and other contributors <https://jquery.org/>
     * Released under MIT license <https://lodash.com/license>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     */

    /** Used as the `TypeError` message for "Functions" methods. */
    var FUNC_ERROR_TEXT$1 = 'Expected a function';

    /** Used as references for various `Number` constants. */
    var NAN = 0 / 0;

    /** `Object#toString` result references. */
    var symbolTag = '[object Symbol]';

    /** Used to match leading and trailing whitespace. */
    var reTrim = /^\s+|\s+$/g;

    /** Used to detect bad signed hexadecimal string values. */
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

    /** Used to detect binary string values. */
    var reIsBinary = /^0b[01]+$/i;

    /** Used to detect octal string values. */
    var reIsOctal = /^0o[0-7]+$/i;

    /** Built-in method references without a dependency on `root`. */
    var freeParseInt = parseInt;

    /** Detect free variable `global` from Node.js. */
    var freeGlobal$1 = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

    /** Detect free variable `self`. */
    var freeSelf$1 = typeof self == 'object' && self && self.Object === Object && self;

    /** Used as a reference to the global object. */
    var root$1 = freeGlobal$1 || freeSelf$1 || Function('return this')();

    /** Used for built-in method references. */
    var objectProto$1 = Object.prototype;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString$1 = objectProto$1.toString;

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeMax = Math.max,
        nativeMin = Math.min;

    /**
     * Gets the timestamp of the number of milliseconds that have elapsed since
     * the Unix epoch (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @since 2.4.0
     * @category Date
     * @returns {number} Returns the timestamp.
     * @example
     *
     * _.defer(function(stamp) {
     *   console.log(_.now() - stamp);
     * }, _.now());
     * // => Logs the number of milliseconds it took for the deferred invocation.
     */
    var now = function() {
      return root$1.Date.now();
    };

    /**
     * Creates a debounced function that delays invoking `func` until after `wait`
     * milliseconds have elapsed since the last time the debounced function was
     * invoked. The debounced function comes with a `cancel` method to cancel
     * delayed `func` invocations and a `flush` method to immediately invoke them.
     * Provide `options` to indicate whether `func` should be invoked on the
     * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
     * with the last arguments provided to the debounced function. Subsequent
     * calls to the debounced function return the result of the last `func`
     * invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is
     * invoked on the trailing edge of the timeout only if the debounced function
     * is invoked more than once during the `wait` timeout.
     *
     * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
     * until to the next tick, similar to `setTimeout` with a timeout of `0`.
     *
     * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
     * for details over the differences between `_.debounce` and `_.throttle`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to debounce.
     * @param {number} [wait=0] The number of milliseconds to delay.
     * @param {Object} [options={}] The options object.
     * @param {boolean} [options.leading=false]
     *  Specify invoking on the leading edge of the timeout.
     * @param {number} [options.maxWait]
     *  The maximum time `func` is allowed to be delayed before it's invoked.
     * @param {boolean} [options.trailing=true]
     *  Specify invoking on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // Avoid costly calculations while the window size is in flux.
     * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
     *
     * // Invoke `sendMail` when clicked, debouncing subsequent calls.
     * jQuery(element).on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * }));
     *
     * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
     * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
     * var source = new EventSource('/stream');
     * jQuery(source).on('message', debounced);
     *
     * // Cancel the trailing debounced invocation.
     * jQuery(window).on('popstate', debounced.cancel);
     */
    function debounce(func, wait, options) {
      var lastArgs,
          lastThis,
          maxWait,
          result,
          timerId,
          lastCallTime,
          lastInvokeTime = 0,
          leading = false,
          maxing = false,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT$1);
      }
      wait = toNumber(wait) || 0;
      if (isObject$1(options)) {
        leading = !!options.leading;
        maxing = 'maxWait' in options;
        maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }

      function invokeFunc(time) {
        var args = lastArgs,
            thisArg = lastThis;

        lastArgs = lastThis = undefined;
        lastInvokeTime = time;
        result = func.apply(thisArg, args);
        return result;
      }

      function leadingEdge(time) {
        // Reset any `maxWait` timer.
        lastInvokeTime = time;
        // Start the timer for the trailing edge.
        timerId = setTimeout(timerExpired, wait);
        // Invoke the leading edge.
        return leading ? invokeFunc(time) : result;
      }

      function remainingWait(time) {
        var timeSinceLastCall = time - lastCallTime,
            timeSinceLastInvoke = time - lastInvokeTime,
            result = wait - timeSinceLastCall;

        return maxing ? nativeMin(result, maxWait - timeSinceLastInvoke) : result;
      }

      function shouldInvoke(time) {
        var timeSinceLastCall = time - lastCallTime,
            timeSinceLastInvoke = time - lastInvokeTime;

        // Either this is the first call, activity has stopped and we're at the
        // trailing edge, the system time has gone backwards and we're treating
        // it as the trailing edge, or we've hit the `maxWait` limit.
        return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
          (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
      }

      function timerExpired() {
        var time = now();
        if (shouldInvoke(time)) {
          return trailingEdge(time);
        }
        // Restart the timer.
        timerId = setTimeout(timerExpired, remainingWait(time));
      }

      function trailingEdge(time) {
        timerId = undefined;

        // Only invoke if we have `lastArgs` which means `func` has been
        // debounced at least once.
        if (trailing && lastArgs) {
          return invokeFunc(time);
        }
        lastArgs = lastThis = undefined;
        return result;
      }

      function cancel() {
        if (timerId !== undefined) {
          clearTimeout(timerId);
        }
        lastInvokeTime = 0;
        lastArgs = lastCallTime = lastThis = timerId = undefined;
      }

      function flush() {
        return timerId === undefined ? result : trailingEdge(now());
      }

      function debounced() {
        var time = now(),
            isInvoking = shouldInvoke(time);

        lastArgs = arguments;
        lastThis = this;
        lastCallTime = time;

        if (isInvoking) {
          if (timerId === undefined) {
            return leadingEdge(lastCallTime);
          }
          if (maxing) {
            // Handle invocations in a tight loop.
            timerId = setTimeout(timerExpired, wait);
            return invokeFunc(lastCallTime);
          }
        }
        if (timerId === undefined) {
          timerId = setTimeout(timerExpired, wait);
        }
        return result;
      }
      debounced.cancel = cancel;
      debounced.flush = flush;
      return debounced;
    }

    /**
     * Checks if `value` is the
     * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
     * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(_.noop);
     * // => true
     *
     * _.isObject(null);
     * // => false
     */
    function isObject$1(value) {
      var type = typeof value;
      return !!value && (type == 'object' || type == 'function');
    }

    /**
     * Checks if `value` is object-like. A value is object-like if it's not `null`
     * and has a `typeof` result of "object".
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     * @example
     *
     * _.isObjectLike({});
     * // => true
     *
     * _.isObjectLike([1, 2, 3]);
     * // => true
     *
     * _.isObjectLike(_.noop);
     * // => false
     *
     * _.isObjectLike(null);
     * // => false
     */
    function isObjectLike(value) {
      return !!value && typeof value == 'object';
    }

    /**
     * Checks if `value` is classified as a `Symbol` primitive or object.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
     * @example
     *
     * _.isSymbol(Symbol.iterator);
     * // => true
     *
     * _.isSymbol('abc');
     * // => false
     */
    function isSymbol(value) {
      return typeof value == 'symbol' ||
        (isObjectLike(value) && objectToString$1.call(value) == symbolTag);
    }

    /**
     * Converts `value` to a number.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to process.
     * @returns {number} Returns the number.
     * @example
     *
     * _.toNumber(3.2);
     * // => 3.2
     *
     * _.toNumber(Number.MIN_VALUE);
     * // => 5e-324
     *
     * _.toNumber(Infinity);
     * // => Infinity
     *
     * _.toNumber('3.2');
     * // => 3.2
     */
    function toNumber(value) {
      if (typeof value == 'number') {
        return value;
      }
      if (isSymbol(value)) {
        return NAN;
      }
      if (isObject$1(value)) {
        var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
        value = isObject$1(other) ? (other + '') : other;
      }
      if (typeof value != 'string') {
        return value === 0 ? value : +value;
      }
      value = value.replace(reTrim, '');
      var isBinary = reIsBinary.test(value);
      return (isBinary || reIsOctal.test(value))
        ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
        : (reIsBadHex.test(value) ? NAN : +value);
    }

    var lodash_debounce = debounce;

    /**
     * lodash (Custom Build) <https://lodash.com/>
     * Build: `lodash modularize exports="npm" -o ./`
     * Copyright jQuery Foundation and other contributors <https://jquery.org/>
     * Released under MIT license <https://lodash.com/license>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     */

    /** Used as the `TypeError` message for "Functions" methods. */
    var FUNC_ERROR_TEXT = 'Expected a function';

    /** Used to stand-in for `undefined` hash values. */
    var HASH_UNDEFINED = '__lodash_hash_undefined__';

    /** `Object#toString` result references. */
    var funcTag = '[object Function]',
        genTag = '[object GeneratorFunction]';

    /**
     * Used to match `RegExp`
     * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
     */
    var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

    /** Used to detect host constructors (Safari). */
    var reIsHostCtor = /^\[object .+?Constructor\]$/;

    /** Detect free variable `global` from Node.js. */
    var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

    /** Detect free variable `self`. */
    var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

    /** Used as a reference to the global object. */
    var root = freeGlobal || freeSelf || Function('return this')();

    /**
     * Gets the value at `key` of `object`.
     *
     * @private
     * @param {Object} [object] The object to query.
     * @param {string} key The key of the property to get.
     * @returns {*} Returns the property value.
     */
    function getValue(object, key) {
      return object == null ? undefined : object[key];
    }

    /**
     * Checks if `value` is a host object in IE < 9.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
     */
    function isHostObject(value) {
      // Many host objects are `Object` objects that can coerce to strings
      // despite having improperly defined `toString` methods.
      var result = false;
      if (value != null && typeof value.toString != 'function') {
        try {
          result = !!(value + '');
        } catch (e) {}
      }
      return result;
    }

    /** Used for built-in method references. */
    var arrayProto = Array.prototype,
        funcProto = Function.prototype,
        objectProto = Object.prototype;

    /** Used to detect overreaching core-js shims. */
    var coreJsData = root['__core-js_shared__'];

    /** Used to detect methods masquerading as native. */
    var maskSrcKey = (function() {
      var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
      return uid ? ('Symbol(src)_1.' + uid) : '';
    }());

    /** Used to resolve the decompiled source of functions. */
    var funcToString = funcProto.toString;

    /** Used to check objects for own properties. */
    var hasOwnProperty = objectProto.hasOwnProperty;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString = objectProto.toString;

    /** Used to detect if a method is native. */
    var reIsNative = RegExp('^' +
      funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
      .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
    );

    /** Built-in value references. */
    var splice = arrayProto.splice;

    /* Built-in method references that are verified to be native. */
    var Map$1 = getNative(root, 'Map'),
        nativeCreate = getNative(Object, 'create');

    /**
     * Creates a hash object.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function Hash(entries) {
      var index = -1,
          length = entries ? entries.length : 0;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    /**
     * Removes all key-value entries from the hash.
     *
     * @private
     * @name clear
     * @memberOf Hash
     */
    function hashClear() {
      this.__data__ = nativeCreate ? nativeCreate(null) : {};
    }

    /**
     * Removes `key` and its value from the hash.
     *
     * @private
     * @name delete
     * @memberOf Hash
     * @param {Object} hash The hash to modify.
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function hashDelete(key) {
      return this.has(key) && delete this.__data__[key];
    }

    /**
     * Gets the hash value for `key`.
     *
     * @private
     * @name get
     * @memberOf Hash
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function hashGet(key) {
      var data = this.__data__;
      if (nativeCreate) {
        var result = data[key];
        return result === HASH_UNDEFINED ? undefined : result;
      }
      return hasOwnProperty.call(data, key) ? data[key] : undefined;
    }

    /**
     * Checks if a hash value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf Hash
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function hashHas(key) {
      var data = this.__data__;
      return nativeCreate ? data[key] !== undefined : hasOwnProperty.call(data, key);
    }

    /**
     * Sets the hash `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf Hash
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the hash instance.
     */
    function hashSet(key, value) {
      var data = this.__data__;
      data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
      return this;
    }

    // Add methods to `Hash`.
    Hash.prototype.clear = hashClear;
    Hash.prototype['delete'] = hashDelete;
    Hash.prototype.get = hashGet;
    Hash.prototype.has = hashHas;
    Hash.prototype.set = hashSet;

    /**
     * Creates an list cache object.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function ListCache(entries) {
      var index = -1,
          length = entries ? entries.length : 0;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    /**
     * Removes all key-value entries from the list cache.
     *
     * @private
     * @name clear
     * @memberOf ListCache
     */
    function listCacheClear() {
      this.__data__ = [];
    }

    /**
     * Removes `key` and its value from the list cache.
     *
     * @private
     * @name delete
     * @memberOf ListCache
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function listCacheDelete(key) {
      var data = this.__data__,
          index = assocIndexOf(data, key);

      if (index < 0) {
        return false;
      }
      var lastIndex = data.length - 1;
      if (index == lastIndex) {
        data.pop();
      } else {
        splice.call(data, index, 1);
      }
      return true;
    }

    /**
     * Gets the list cache value for `key`.
     *
     * @private
     * @name get
     * @memberOf ListCache
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function listCacheGet(key) {
      var data = this.__data__,
          index = assocIndexOf(data, key);

      return index < 0 ? undefined : data[index][1];
    }

    /**
     * Checks if a list cache value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf ListCache
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function listCacheHas(key) {
      return assocIndexOf(this.__data__, key) > -1;
    }

    /**
     * Sets the list cache `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf ListCache
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the list cache instance.
     */
    function listCacheSet(key, value) {
      var data = this.__data__,
          index = assocIndexOf(data, key);

      if (index < 0) {
        data.push([key, value]);
      } else {
        data[index][1] = value;
      }
      return this;
    }

    // Add methods to `ListCache`.
    ListCache.prototype.clear = listCacheClear;
    ListCache.prototype['delete'] = listCacheDelete;
    ListCache.prototype.get = listCacheGet;
    ListCache.prototype.has = listCacheHas;
    ListCache.prototype.set = listCacheSet;

    /**
     * Creates a map cache object to store key-value pairs.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function MapCache(entries) {
      var index = -1,
          length = entries ? entries.length : 0;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    /**
     * Removes all key-value entries from the map.
     *
     * @private
     * @name clear
     * @memberOf MapCache
     */
    function mapCacheClear() {
      this.__data__ = {
        'hash': new Hash,
        'map': new (Map$1 || ListCache),
        'string': new Hash
      };
    }

    /**
     * Removes `key` and its value from the map.
     *
     * @private
     * @name delete
     * @memberOf MapCache
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function mapCacheDelete(key) {
      return getMapData(this, key)['delete'](key);
    }

    /**
     * Gets the map value for `key`.
     *
     * @private
     * @name get
     * @memberOf MapCache
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function mapCacheGet(key) {
      return getMapData(this, key).get(key);
    }

    /**
     * Checks if a map value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf MapCache
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function mapCacheHas(key) {
      return getMapData(this, key).has(key);
    }

    /**
     * Sets the map `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf MapCache
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the map cache instance.
     */
    function mapCacheSet(key, value) {
      getMapData(this, key).set(key, value);
      return this;
    }

    // Add methods to `MapCache`.
    MapCache.prototype.clear = mapCacheClear;
    MapCache.prototype['delete'] = mapCacheDelete;
    MapCache.prototype.get = mapCacheGet;
    MapCache.prototype.has = mapCacheHas;
    MapCache.prototype.set = mapCacheSet;

    /**
     * Gets the index at which the `key` is found in `array` of key-value pairs.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {*} key The key to search for.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function assocIndexOf(array, key) {
      var length = array.length;
      while (length--) {
        if (eq(array[length][0], key)) {
          return length;
        }
      }
      return -1;
    }

    /**
     * The base implementation of `_.isNative` without bad shim checks.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a native function,
     *  else `false`.
     */
    function baseIsNative(value) {
      if (!isObject(value) || isMasked(value)) {
        return false;
      }
      var pattern = (isFunction(value) || isHostObject(value)) ? reIsNative : reIsHostCtor;
      return pattern.test(toSource(value));
    }

    /**
     * Gets the data for `map`.
     *
     * @private
     * @param {Object} map The map to query.
     * @param {string} key The reference key.
     * @returns {*} Returns the map data.
     */
    function getMapData(map, key) {
      var data = map.__data__;
      return isKeyable(key)
        ? data[typeof key == 'string' ? 'string' : 'hash']
        : data.map;
    }

    /**
     * Gets the native function at `key` of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {string} key The key of the method to get.
     * @returns {*} Returns the function if it's native, else `undefined`.
     */
    function getNative(object, key) {
      var value = getValue(object, key);
      return baseIsNative(value) ? value : undefined;
    }

    /**
     * Checks if `value` is suitable for use as unique object key.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
     */
    function isKeyable(value) {
      var type = typeof value;
      return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
        ? (value !== '__proto__')
        : (value === null);
    }

    /**
     * Checks if `func` has its source masked.
     *
     * @private
     * @param {Function} func The function to check.
     * @returns {boolean} Returns `true` if `func` is masked, else `false`.
     */
    function isMasked(func) {
      return !!maskSrcKey && (maskSrcKey in func);
    }

    /**
     * Converts `func` to its source code.
     *
     * @private
     * @param {Function} func The function to process.
     * @returns {string} Returns the source code.
     */
    function toSource(func) {
      if (func != null) {
        try {
          return funcToString.call(func);
        } catch (e) {}
        try {
          return (func + '');
        } catch (e) {}
      }
      return '';
    }

    /**
     * Creates a function that memoizes the result of `func`. If `resolver` is
     * provided, it determines the cache key for storing the result based on the
     * arguments provided to the memoized function. By default, the first argument
     * provided to the memoized function is used as the map cache key. The `func`
     * is invoked with the `this` binding of the memoized function.
     *
     * **Note:** The cache is exposed as the `cache` property on the memoized
     * function. Its creation may be customized by replacing the `_.memoize.Cache`
     * constructor with one whose instances implement the
     * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
     * method interface of `delete`, `get`, `has`, and `set`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to have its output memoized.
     * @param {Function} [resolver] The function to resolve the cache key.
     * @returns {Function} Returns the new memoized function.
     * @example
     *
     * var object = { 'a': 1, 'b': 2 };
     * var other = { 'c': 3, 'd': 4 };
     *
     * var values = _.memoize(_.values);
     * values(object);
     * // => [1, 2]
     *
     * values(other);
     * // => [3, 4]
     *
     * object.a = 2;
     * values(object);
     * // => [1, 2]
     *
     * // Modify the result cache.
     * values.cache.set(object, ['a', 'b']);
     * values(object);
     * // => ['a', 'b']
     *
     * // Replace `_.memoize.Cache`.
     * _.memoize.Cache = WeakMap;
     */
    function memoize(func, resolver) {
      if (typeof func != 'function' || (resolver && typeof resolver != 'function')) {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      var memoized = function() {
        var args = arguments,
            key = resolver ? resolver.apply(this, args) : args[0],
            cache = memoized.cache;

        if (cache.has(key)) {
          return cache.get(key);
        }
        var result = func.apply(this, args);
        memoized.cache = cache.set(key, result);
        return result;
      };
      memoized.cache = new (memoize.Cache || MapCache);
      return memoized;
    }

    // Assign cache to `_.memoize`.
    memoize.Cache = MapCache;

    /**
     * Performs a
     * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * comparison between two values to determine if they are equivalent.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'a': 1 };
     * var other = { 'a': 1 };
     *
     * _.eq(object, object);
     * // => true
     *
     * _.eq(object, other);
     * // => false
     *
     * _.eq('a', 'a');
     * // => true
     *
     * _.eq('a', Object('a'));
     * // => false
     *
     * _.eq(NaN, NaN);
     * // => true
     */
    function eq(value, other) {
      return value === other || (value !== value && other !== other);
    }

    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     *
     * _.isFunction(/abc/);
     * // => false
     */
    function isFunction(value) {
      // The use of `Object#toString` avoids issues with the `typeof` operator
      // in Safari 8-9 which returns 'object' for typed array and other constructors.
      var tag = isObject(value) ? objectToString.call(value) : '';
      return tag == funcTag || tag == genTag;
    }

    /**
     * Checks if `value` is the
     * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
     * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(_.noop);
     * // => true
     *
     * _.isObject(null);
     * // => false
     */
    function isObject(value) {
      var type = typeof value;
      return !!value && (type == 'object' || type == 'function');
    }

    var lodash_memoize = memoize;

    var resizeObservers = [];

    var hasActiveObservations = function () {
        return resizeObservers.some(function (ro) { return ro.activeTargets.length > 0; });
    };

    var hasSkippedObservations = function () {
        return resizeObservers.some(function (ro) { return ro.skippedTargets.length > 0; });
    };

    var msg = 'ResizeObserver loop completed with undelivered notifications.';
    var deliverResizeLoopError = function () {
        var event;
        if (typeof ErrorEvent === 'function') {
            event = new ErrorEvent('error', {
                message: msg
            });
        }
        else {
            event = document.createEvent('Event');
            event.initEvent('error', false, false);
            event.message = msg;
        }
        window.dispatchEvent(event);
    };

    var ResizeObserverBoxOptions;
    (function (ResizeObserverBoxOptions) {
        ResizeObserverBoxOptions["BORDER_BOX"] = "border-box";
        ResizeObserverBoxOptions["CONTENT_BOX"] = "content-box";
        ResizeObserverBoxOptions["DEVICE_PIXEL_CONTENT_BOX"] = "device-pixel-content-box";
    })(ResizeObserverBoxOptions || (ResizeObserverBoxOptions = {}));

    var freeze = function (obj) { return Object.freeze(obj); };

    var ResizeObserverSize = (function () {
        function ResizeObserverSize(inlineSize, blockSize) {
            this.inlineSize = inlineSize;
            this.blockSize = blockSize;
            freeze(this);
        }
        return ResizeObserverSize;
    }());

    var DOMRectReadOnly = (function () {
        function DOMRectReadOnly(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.top = this.y;
            this.left = this.x;
            this.bottom = this.top + this.height;
            this.right = this.left + this.width;
            return freeze(this);
        }
        DOMRectReadOnly.prototype.toJSON = function () {
            var _a = this, x = _a.x, y = _a.y, top = _a.top, right = _a.right, bottom = _a.bottom, left = _a.left, width = _a.width, height = _a.height;
            return { x: x, y: y, top: top, right: right, bottom: bottom, left: left, width: width, height: height };
        };
        DOMRectReadOnly.fromRect = function (rectangle) {
            return new DOMRectReadOnly(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
        };
        return DOMRectReadOnly;
    }());

    var isSVG = function (target) { return target instanceof SVGElement && 'getBBox' in target; };
    var isHidden = function (target) {
        if (isSVG(target)) {
            var _a = target.getBBox(), width = _a.width, height = _a.height;
            return !width && !height;
        }
        var _b = target, offsetWidth = _b.offsetWidth, offsetHeight = _b.offsetHeight;
        return !(offsetWidth || offsetHeight || target.getClientRects().length);
    };
    var isElement = function (obj) {
        var _a, _b;
        if (obj instanceof Element) {
            return true;
        }
        var scope = (_b = (_a = obj) === null || _a === void 0 ? void 0 : _a.ownerDocument) === null || _b === void 0 ? void 0 : _b.defaultView;
        return !!(scope && obj instanceof scope.Element);
    };
    var isReplacedElement = function (target) {
        switch (target.tagName) {
            case 'INPUT':
                if (target.type !== 'image') {
                    break;
                }
            case 'VIDEO':
            case 'AUDIO':
            case 'EMBED':
            case 'OBJECT':
            case 'CANVAS':
            case 'IFRAME':
            case 'IMG':
                return true;
        }
        return false;
    };

    var global$1 = typeof window !== 'undefined' ? window : {};

    var cache = new WeakMap();
    var scrollRegexp = /auto|scroll/;
    var verticalRegexp = /^tb|vertical/;
    var IE = (/msie|trident/i).test(global$1.navigator && global$1.navigator.userAgent);
    var parseDimension = function (pixel) { return parseFloat(pixel || '0'); };
    var size = function (inlineSize, blockSize, switchSizes) {
        if (inlineSize === void 0) { inlineSize = 0; }
        if (blockSize === void 0) { blockSize = 0; }
        if (switchSizes === void 0) { switchSizes = false; }
        return new ResizeObserverSize((switchSizes ? blockSize : inlineSize) || 0, (switchSizes ? inlineSize : blockSize) || 0);
    };
    var zeroBoxes = freeze({
        devicePixelContentBoxSize: size(),
        borderBoxSize: size(),
        contentBoxSize: size(),
        contentRect: new DOMRectReadOnly(0, 0, 0, 0)
    });
    var calculateBoxSizes = function (target, forceRecalculation) {
        if (forceRecalculation === void 0) { forceRecalculation = false; }
        if (cache.has(target) && !forceRecalculation) {
            return cache.get(target);
        }
        if (isHidden(target)) {
            cache.set(target, zeroBoxes);
            return zeroBoxes;
        }
        var cs = getComputedStyle(target);
        var svg = isSVG(target) && target.ownerSVGElement && target.getBBox();
        var removePadding = !IE && cs.boxSizing === 'border-box';
        var switchSizes = verticalRegexp.test(cs.writingMode || '');
        var canScrollVertically = !svg && scrollRegexp.test(cs.overflowY || '');
        var canScrollHorizontally = !svg && scrollRegexp.test(cs.overflowX || '');
        var paddingTop = svg ? 0 : parseDimension(cs.paddingTop);
        var paddingRight = svg ? 0 : parseDimension(cs.paddingRight);
        var paddingBottom = svg ? 0 : parseDimension(cs.paddingBottom);
        var paddingLeft = svg ? 0 : parseDimension(cs.paddingLeft);
        var borderTop = svg ? 0 : parseDimension(cs.borderTopWidth);
        var borderRight = svg ? 0 : parseDimension(cs.borderRightWidth);
        var borderBottom = svg ? 0 : parseDimension(cs.borderBottomWidth);
        var borderLeft = svg ? 0 : parseDimension(cs.borderLeftWidth);
        var horizontalPadding = paddingLeft + paddingRight;
        var verticalPadding = paddingTop + paddingBottom;
        var horizontalBorderArea = borderLeft + borderRight;
        var verticalBorderArea = borderTop + borderBottom;
        var horizontalScrollbarThickness = !canScrollHorizontally ? 0 : target.offsetHeight - verticalBorderArea - target.clientHeight;
        var verticalScrollbarThickness = !canScrollVertically ? 0 : target.offsetWidth - horizontalBorderArea - target.clientWidth;
        var widthReduction = removePadding ? horizontalPadding + horizontalBorderArea : 0;
        var heightReduction = removePadding ? verticalPadding + verticalBorderArea : 0;
        var contentWidth = svg ? svg.width : parseDimension(cs.width) - widthReduction - verticalScrollbarThickness;
        var contentHeight = svg ? svg.height : parseDimension(cs.height) - heightReduction - horizontalScrollbarThickness;
        var borderBoxWidth = contentWidth + horizontalPadding + verticalScrollbarThickness + horizontalBorderArea;
        var borderBoxHeight = contentHeight + verticalPadding + horizontalScrollbarThickness + verticalBorderArea;
        var boxes = freeze({
            devicePixelContentBoxSize: size(Math.round(contentWidth * devicePixelRatio), Math.round(contentHeight * devicePixelRatio), switchSizes),
            borderBoxSize: size(borderBoxWidth, borderBoxHeight, switchSizes),
            contentBoxSize: size(contentWidth, contentHeight, switchSizes),
            contentRect: new DOMRectReadOnly(paddingLeft, paddingTop, contentWidth, contentHeight)
        });
        cache.set(target, boxes);
        return boxes;
    };
    var calculateBoxSize = function (target, observedBox, forceRecalculation) {
        var _a = calculateBoxSizes(target, forceRecalculation), borderBoxSize = _a.borderBoxSize, contentBoxSize = _a.contentBoxSize, devicePixelContentBoxSize = _a.devicePixelContentBoxSize;
        switch (observedBox) {
            case ResizeObserverBoxOptions.DEVICE_PIXEL_CONTENT_BOX:
                return devicePixelContentBoxSize;
            case ResizeObserverBoxOptions.BORDER_BOX:
                return borderBoxSize;
            default:
                return contentBoxSize;
        }
    };

    var ResizeObserverEntry = (function () {
        function ResizeObserverEntry(target) {
            var boxes = calculateBoxSizes(target);
            this.target = target;
            this.contentRect = boxes.contentRect;
            this.borderBoxSize = freeze([boxes.borderBoxSize]);
            this.contentBoxSize = freeze([boxes.contentBoxSize]);
            this.devicePixelContentBoxSize = freeze([boxes.devicePixelContentBoxSize]);
        }
        return ResizeObserverEntry;
    }());

    var calculateDepthForNode = function (node) {
        if (isHidden(node)) {
            return Infinity;
        }
        var depth = 0;
        var parent = node.parentNode;
        while (parent) {
            depth += 1;
            parent = parent.parentNode;
        }
        return depth;
    };

    var broadcastActiveObservations = function () {
        var shallowestDepth = Infinity;
        var callbacks = [];
        resizeObservers.forEach(function processObserver(ro) {
            if (ro.activeTargets.length === 0) {
                return;
            }
            var entries = [];
            ro.activeTargets.forEach(function processTarget(ot) {
                var entry = new ResizeObserverEntry(ot.target);
                var targetDepth = calculateDepthForNode(ot.target);
                entries.push(entry);
                ot.lastReportedSize = calculateBoxSize(ot.target, ot.observedBox);
                if (targetDepth < shallowestDepth) {
                    shallowestDepth = targetDepth;
                }
            });
            callbacks.push(function resizeObserverCallback() {
                ro.callback.call(ro.observer, entries, ro.observer);
            });
            ro.activeTargets.splice(0, ro.activeTargets.length);
        });
        for (var _i = 0, callbacks_1 = callbacks; _i < callbacks_1.length; _i++) {
            var callback = callbacks_1[_i];
            callback();
        }
        return shallowestDepth;
    };

    var gatherActiveObservationsAtDepth = function (depth) {
        resizeObservers.forEach(function processObserver(ro) {
            ro.activeTargets.splice(0, ro.activeTargets.length);
            ro.skippedTargets.splice(0, ro.skippedTargets.length);
            ro.observationTargets.forEach(function processTarget(ot) {
                if (ot.isActive()) {
                    if (calculateDepthForNode(ot.target) > depth) {
                        ro.activeTargets.push(ot);
                    }
                    else {
                        ro.skippedTargets.push(ot);
                    }
                }
            });
        });
    };

    var process = function () {
        var depth = 0;
        gatherActiveObservationsAtDepth(depth);
        while (hasActiveObservations()) {
            depth = broadcastActiveObservations();
            gatherActiveObservationsAtDepth(depth);
        }
        if (hasSkippedObservations()) {
            deliverResizeLoopError();
        }
        return depth > 0;
    };

    var trigger;
    var callbacks = [];
    var notify = function () { return callbacks.splice(0).forEach(function (cb) { return cb(); }); };
    var queueMicroTask = function (callback) {
        if (!trigger) {
            var toggle_1 = 0;
            var el_1 = document.createTextNode('');
            var config = { characterData: true };
            new MutationObserver(function () { return notify(); }).observe(el_1, config);
            trigger = function () { el_1.textContent = "" + (toggle_1 ? toggle_1-- : toggle_1++); };
        }
        callbacks.push(callback);
        trigger();
    };

    var queueResizeObserver = function (cb) {
        queueMicroTask(function ResizeObserver() {
            requestAnimationFrame(cb);
        });
    };

    var watching = 0;
    var isWatching = function () { return !!watching; };
    var CATCH_PERIOD = 250;
    var observerConfig = { attributes: true, characterData: true, childList: true, subtree: true };
    var events = [
        'resize',
        'load',
        'transitionend',
        'animationend',
        'animationstart',
        'animationiteration',
        'keyup',
        'keydown',
        'mouseup',
        'mousedown',
        'mouseover',
        'mouseout',
        'blur',
        'focus'
    ];
    var time = function (timeout) {
        if (timeout === void 0) { timeout = 0; }
        return Date.now() + timeout;
    };
    var scheduled = false;
    var Scheduler = (function () {
        function Scheduler() {
            var _this = this;
            this.stopped = true;
            this.listener = function () { return _this.schedule(); };
        }
        Scheduler.prototype.run = function (timeout) {
            var _this = this;
            if (timeout === void 0) { timeout = CATCH_PERIOD; }
            if (scheduled) {
                return;
            }
            scheduled = true;
            var until = time(timeout);
            queueResizeObserver(function () {
                var elementsHaveResized = false;
                try {
                    elementsHaveResized = process();
                }
                finally {
                    scheduled = false;
                    timeout = until - time();
                    if (!isWatching()) {
                        return;
                    }
                    if (elementsHaveResized) {
                        _this.run(1000);
                    }
                    else if (timeout > 0) {
                        _this.run(timeout);
                    }
                    else {
                        _this.start();
                    }
                }
            });
        };
        Scheduler.prototype.schedule = function () {
            this.stop();
            this.run();
        };
        Scheduler.prototype.observe = function () {
            var _this = this;
            var cb = function () { return _this.observer && _this.observer.observe(document.body, observerConfig); };
            document.body ? cb() : global$1.addEventListener('DOMContentLoaded', cb);
        };
        Scheduler.prototype.start = function () {
            var _this = this;
            if (this.stopped) {
                this.stopped = false;
                this.observer = new MutationObserver(this.listener);
                this.observe();
                events.forEach(function (name) { return global$1.addEventListener(name, _this.listener, true); });
            }
        };
        Scheduler.prototype.stop = function () {
            var _this = this;
            if (!this.stopped) {
                this.observer && this.observer.disconnect();
                events.forEach(function (name) { return global$1.removeEventListener(name, _this.listener, true); });
                this.stopped = true;
            }
        };
        return Scheduler;
    }());
    var scheduler = new Scheduler();
    var updateCount = function (n) {
        !watching && n > 0 && scheduler.start();
        watching += n;
        !watching && scheduler.stop();
    };

    var skipNotifyOnElement = function (target) {
        return !isSVG(target)
            && !isReplacedElement(target)
            && getComputedStyle(target).display === 'inline';
    };
    var ResizeObservation = (function () {
        function ResizeObservation(target, observedBox) {
            this.target = target;
            this.observedBox = observedBox || ResizeObserverBoxOptions.CONTENT_BOX;
            this.lastReportedSize = {
                inlineSize: 0,
                blockSize: 0
            };
        }
        ResizeObservation.prototype.isActive = function () {
            var size = calculateBoxSize(this.target, this.observedBox, true);
            if (skipNotifyOnElement(this.target)) {
                this.lastReportedSize = size;
            }
            if (this.lastReportedSize.inlineSize !== size.inlineSize
                || this.lastReportedSize.blockSize !== size.blockSize) {
                return true;
            }
            return false;
        };
        return ResizeObservation;
    }());

    var ResizeObserverDetail = (function () {
        function ResizeObserverDetail(resizeObserver, callback) {
            this.activeTargets = [];
            this.skippedTargets = [];
            this.observationTargets = [];
            this.observer = resizeObserver;
            this.callback = callback;
        }
        return ResizeObserverDetail;
    }());

    var observerMap = new WeakMap();
    var getObservationIndex = function (observationTargets, target) {
        for (var i = 0; i < observationTargets.length; i += 1) {
            if (observationTargets[i].target === target) {
                return i;
            }
        }
        return -1;
    };
    var ResizeObserverController = (function () {
        function ResizeObserverController() {
        }
        ResizeObserverController.connect = function (resizeObserver, callback) {
            var detail = new ResizeObserverDetail(resizeObserver, callback);
            observerMap.set(resizeObserver, detail);
        };
        ResizeObserverController.observe = function (resizeObserver, target, options) {
            var detail = observerMap.get(resizeObserver);
            var firstObservation = detail.observationTargets.length === 0;
            if (getObservationIndex(detail.observationTargets, target) < 0) {
                firstObservation && resizeObservers.push(detail);
                detail.observationTargets.push(new ResizeObservation(target, options && options.box));
                updateCount(1);
                scheduler.schedule();
            }
        };
        ResizeObserverController.unobserve = function (resizeObserver, target) {
            var detail = observerMap.get(resizeObserver);
            var index = getObservationIndex(detail.observationTargets, target);
            var lastObservation = detail.observationTargets.length === 1;
            if (index >= 0) {
                lastObservation && resizeObservers.splice(resizeObservers.indexOf(detail), 1);
                detail.observationTargets.splice(index, 1);
                updateCount(-1);
            }
        };
        ResizeObserverController.disconnect = function (resizeObserver) {
            var _this = this;
            var detail = observerMap.get(resizeObserver);
            detail.observationTargets.slice().forEach(function (ot) { return _this.unobserve(resizeObserver, ot.target); });
            detail.activeTargets.splice(0, detail.activeTargets.length);
        };
        return ResizeObserverController;
    }());

    var ResizeObserver = (function () {
        function ResizeObserver(callback) {
            if (arguments.length === 0) {
                throw new TypeError("Failed to construct 'ResizeObserver': 1 argument required, but only 0 present.");
            }
            if (typeof callback !== 'function') {
                throw new TypeError("Failed to construct 'ResizeObserver': The callback provided as parameter 1 is not a function.");
            }
            ResizeObserverController.connect(this, callback);
        }
        ResizeObserver.prototype.observe = function (target, options) {
            if (arguments.length === 0) {
                throw new TypeError("Failed to execute 'observe' on 'ResizeObserver': 1 argument required, but only 0 present.");
            }
            if (!isElement(target)) {
                throw new TypeError("Failed to execute 'observe' on 'ResizeObserver': parameter 1 is not of type 'Element");
            }
            ResizeObserverController.observe(this, target, options);
        };
        ResizeObserver.prototype.unobserve = function (target) {
            if (arguments.length === 0) {
                throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': 1 argument required, but only 0 present.");
            }
            if (!isElement(target)) {
                throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': parameter 1 is not of type 'Element");
            }
            ResizeObserverController.unobserve(this, target);
        };
        ResizeObserver.prototype.disconnect = function () {
            ResizeObserverController.disconnect(this);
        };
        ResizeObserver.toString = function () {
            return 'function ResizeObserver () { [polyfill code] }';
        };
        return ResizeObserver;
    }());

    var TypeError$2 = global$2.TypeError;

    // `Array.prototype.{ reduce, reduceRight }` methods implementation
    var createMethod = function (IS_RIGHT) {
      return function (that, callbackfn, argumentsLength, memo) {
        aCallable(callbackfn);
        var O = toObject(that);
        var self = indexedObject(O);
        var length = lengthOfArrayLike(O);
        var index = IS_RIGHT ? length - 1 : 0;
        var i = IS_RIGHT ? -1 : 1;
        if (argumentsLength < 2) while (true) {
          if (index in self) {
            memo = self[index];
            index += i;
            break;
          }
          index += i;
          if (IS_RIGHT ? index < 0 : length <= index) {
            throw TypeError$2('Reduce of empty array with no initial value');
          }
        }
        for (;IS_RIGHT ? index >= 0 : length > index; index += i) if (index in self) {
          memo = callbackfn(memo, self[index], index, O);
        }
        return memo;
      };
    };

    var arrayReduce = {
      // `Array.prototype.reduce` method
      // https://tc39.es/ecma262/#sec-array.prototype.reduce
      left: createMethod(false),
      // `Array.prototype.reduceRight` method
      // https://tc39.es/ecma262/#sec-array.prototype.reduceright
      right: createMethod(true)
    };

    var engineIsNode = classofRaw(global$2.process) == 'process';

    var $reduce = arrayReduce.left;




    var STRICT_METHOD = arrayMethodIsStrict('reduce');
    // Chrome 80-82 has a critical bug
    // https://bugs.chromium.org/p/chromium/issues/detail?id=1049982
    var CHROME_BUG = !engineIsNode && engineV8Version > 79 && engineV8Version < 83;

    // `Array.prototype.reduce` method
    // https://tc39.es/ecma262/#sec-array.prototype.reduce
    _export({ target: 'Array', proto: true, forced: !STRICT_METHOD || CHROME_BUG }, {
      reduce: function reduce(callbackfn /* , initialValue */) {
        var length = arguments.length;
        return $reduce(this, callbackfn, length, length > 1 ? arguments[1] : undefined);
      }
    });

    var FUNCTION_NAME_EXISTS = functionName.EXISTS;

    var defineProperty = objectDefineProperty.f;

    var FunctionPrototype$1 = Function.prototype;
    var functionToString = functionUncurryThis(FunctionPrototype$1.toString);
    var nameRE = /function\b(?:\s|\/\*[\S\s]*?\*\/|\/\/[^\n\r]*[\n\r]+)*([^\s(/]*)/;
    var regExpExec = functionUncurryThis(nameRE.exec);
    var NAME = 'name';

    // Function instances `.name` property
    // https://tc39.es/ecma262/#sec-function-instances-name
    if (descriptors && !FUNCTION_NAME_EXISTS) {
      defineProperty(FunctionPrototype$1, NAME, {
        configurable: true,
        get: function () {
          try {
            return regExpExec(nameRE, functionToString(this))[1];
          } catch (error) {
            return '';
          }
        }
      });
    }

    // `RegExp.prototype.flags` getter implementation
    // https://tc39.es/ecma262/#sec-get-regexp.prototype.flags
    var regexpFlags = function () {
      var that = anObject(this);
      var result = '';
      if (that.global) result += 'g';
      if (that.ignoreCase) result += 'i';
      if (that.multiline) result += 'm';
      if (that.dotAll) result += 's';
      if (that.unicode) result += 'u';
      if (that.sticky) result += 'y';
      return result;
    };

    // babel-minify and Closure Compiler transpiles RegExp('a', 'y') -> /a/y and it causes SyntaxError
    var $RegExp$2 = global$2.RegExp;

    var UNSUPPORTED_Y$1 = fails(function () {
      var re = $RegExp$2('a', 'y');
      re.lastIndex = 2;
      return re.exec('abcd') != null;
    });

    // UC Browser bug
    // https://github.com/zloirock/core-js/issues/1008
    var MISSED_STICKY = UNSUPPORTED_Y$1 || fails(function () {
      return !$RegExp$2('a', 'y').sticky;
    });

    var BROKEN_CARET = UNSUPPORTED_Y$1 || fails(function () {
      // https://bugzilla.mozilla.org/show_bug.cgi?id=773687
      var re = $RegExp$2('^r', 'gy');
      re.lastIndex = 2;
      return re.exec('str') != null;
    });

    var regexpStickyHelpers = {
      BROKEN_CARET: BROKEN_CARET,
      MISSED_STICKY: MISSED_STICKY,
      UNSUPPORTED_Y: UNSUPPORTED_Y$1
    };

    // babel-minify and Closure Compiler transpiles RegExp('.', 's') -> /./s and it causes SyntaxError
    var $RegExp$1 = global$2.RegExp;

    var regexpUnsupportedDotAll = fails(function () {
      var re = $RegExp$1('.', 's');
      return !(re.dotAll && re.exec('\n') && re.flags === 's');
    });

    // babel-minify and Closure Compiler transpiles RegExp('(?<a>b)', 'g') -> /(?<a>b)/g and it causes SyntaxError
    var $RegExp = global$2.RegExp;

    var regexpUnsupportedNcg = fails(function () {
      var re = $RegExp('(?<a>b)', 'g');
      return re.exec('b').groups.a !== 'b' ||
        'b'.replace(re, '$<a>c') !== 'bc';
    });

    /* eslint-disable regexp/no-empty-capturing-group, regexp/no-empty-group, regexp/no-lazy-ends -- testing */
    /* eslint-disable regexp/no-useless-quantifier -- testing */







    var getInternalState = internalState.get;



    var nativeReplace = shared('native-string-replace', String.prototype.replace);
    var nativeExec = RegExp.prototype.exec;
    var patchedExec = nativeExec;
    var charAt$2 = functionUncurryThis(''.charAt);
    var indexOf = functionUncurryThis(''.indexOf);
    var replace$1 = functionUncurryThis(''.replace);
    var stringSlice$2 = functionUncurryThis(''.slice);

    var UPDATES_LAST_INDEX_WRONG = (function () {
      var re1 = /a/;
      var re2 = /b*/g;
      functionCall(nativeExec, re1, 'a');
      functionCall(nativeExec, re2, 'a');
      return re1.lastIndex !== 0 || re2.lastIndex !== 0;
    })();

    var UNSUPPORTED_Y = regexpStickyHelpers.BROKEN_CARET;

    // nonparticipating capturing group, copied from es5-shim's String#split patch.
    var NPCG_INCLUDED = /()??/.exec('')[1] !== undefined;

    var PATCH = UPDATES_LAST_INDEX_WRONG || NPCG_INCLUDED || UNSUPPORTED_Y || regexpUnsupportedDotAll || regexpUnsupportedNcg;

    if (PATCH) {
      patchedExec = function exec(string) {
        var re = this;
        var state = getInternalState(re);
        var str = toString(string);
        var raw = state.raw;
        var result, reCopy, lastIndex, match, i, object, group;

        if (raw) {
          raw.lastIndex = re.lastIndex;
          result = functionCall(patchedExec, raw, str);
          re.lastIndex = raw.lastIndex;
          return result;
        }

        var groups = state.groups;
        var sticky = UNSUPPORTED_Y && re.sticky;
        var flags = functionCall(regexpFlags, re);
        var source = re.source;
        var charsAdded = 0;
        var strCopy = str;

        if (sticky) {
          flags = replace$1(flags, 'y', '');
          if (indexOf(flags, 'g') === -1) {
            flags += 'g';
          }

          strCopy = stringSlice$2(str, re.lastIndex);
          // Support anchored sticky behavior.
          if (re.lastIndex > 0 && (!re.multiline || re.multiline && charAt$2(str, re.lastIndex - 1) !== '\n')) {
            source = '(?: ' + source + ')';
            strCopy = ' ' + strCopy;
            charsAdded++;
          }
          // ^(? + rx + ) is needed, in combination with some str slicing, to
          // simulate the 'y' flag.
          reCopy = new RegExp('^(?:' + source + ')', flags);
        }

        if (NPCG_INCLUDED) {
          reCopy = new RegExp('^' + source + '$(?!\\s)', flags);
        }
        if (UPDATES_LAST_INDEX_WRONG) lastIndex = re.lastIndex;

        match = functionCall(nativeExec, sticky ? reCopy : re, strCopy);

        if (sticky) {
          if (match) {
            match.input = stringSlice$2(match.input, charsAdded);
            match[0] = stringSlice$2(match[0], charsAdded);
            match.index = re.lastIndex;
            re.lastIndex += match[0].length;
          } else re.lastIndex = 0;
        } else if (UPDATES_LAST_INDEX_WRONG && match) {
          re.lastIndex = re.global ? match.index + match[0].length : lastIndex;
        }
        if (NPCG_INCLUDED && match && match.length > 1) {
          // Fix browsers whose `exec` methods don't consistently return `undefined`
          // for NPCG, like IE8. NOTE: This doesn' work for /(.?)?/
          functionCall(nativeReplace, match[0], reCopy, function () {
            for (i = 1; i < arguments.length - 2; i++) {
              if (arguments[i] === undefined) match[i] = undefined;
            }
          });
        }

        if (match && groups) {
          match.groups = object = objectCreate(null);
          for (i = 0; i < groups.length; i++) {
            group = groups[i];
            object[group[0]] = match[group[1]];
          }
        }

        return match;
      };
    }

    var regexpExec = patchedExec;

    // `RegExp.prototype.exec` method
    // https://tc39.es/ecma262/#sec-regexp.prototype.exec
    _export({ target: 'RegExp', proto: true, forced: /./.exec !== regexpExec }, {
      exec: regexpExec
    });

    // TODO: Remove from `core-js@4` since it's moved to entry points








    var SPECIES = wellKnownSymbol('species');
    var RegExpPrototype = RegExp.prototype;

    var fixRegexpWellKnownSymbolLogic = function (KEY, exec, FORCED, SHAM) {
      var SYMBOL = wellKnownSymbol(KEY);

      var DELEGATES_TO_SYMBOL = !fails(function () {
        // String methods call symbol-named RegEp methods
        var O = {};
        O[SYMBOL] = function () { return 7; };
        return ''[KEY](O) != 7;
      });

      var DELEGATES_TO_EXEC = DELEGATES_TO_SYMBOL && !fails(function () {
        // Symbol-named RegExp methods call .exec
        var execCalled = false;
        var re = /a/;

        if (KEY === 'split') {
          // We can't use real regex here since it causes deoptimization
          // and serious performance degradation in V8
          // https://github.com/zloirock/core-js/issues/306
          re = {};
          // RegExp[@@split] doesn't call the regex's exec method, but first creates
          // a new one. We need to return the patched regex when creating the new one.
          re.constructor = {};
          re.constructor[SPECIES] = function () { return re; };
          re.flags = '';
          re[SYMBOL] = /./[SYMBOL];
        }

        re.exec = function () { execCalled = true; return null; };

        re[SYMBOL]('');
        return !execCalled;
      });

      if (
        !DELEGATES_TO_SYMBOL ||
        !DELEGATES_TO_EXEC ||
        FORCED
      ) {
        var uncurriedNativeRegExpMethod = functionUncurryThis(/./[SYMBOL]);
        var methods = exec(SYMBOL, ''[KEY], function (nativeMethod, regexp, str, arg2, forceStringMethod) {
          var uncurriedNativeMethod = functionUncurryThis(nativeMethod);
          var $exec = regexp.exec;
          if ($exec === regexpExec || $exec === RegExpPrototype.exec) {
            if (DELEGATES_TO_SYMBOL && !forceStringMethod) {
              // The native String method already delegates to @@method (this
              // polyfilled function), leasing to infinite recursion.
              // We avoid it by directly calling the native @@method method.
              return { done: true, value: uncurriedNativeRegExpMethod(regexp, str, arg2) };
            }
            return { done: true, value: uncurriedNativeMethod(str, regexp, arg2) };
          }
          return { done: false };
        });

        redefine(String.prototype, KEY, methods[0]);
        redefine(RegExpPrototype, SYMBOL, methods[1]);
      }

      if (SHAM) createNonEnumerableProperty(RegExpPrototype[SYMBOL], 'sham', true);
    };

    var charAt$1 = stringMultibyte.charAt;

    // `AdvanceStringIndex` abstract operation
    // https://tc39.es/ecma262/#sec-advancestringindex
    var advanceStringIndex = function (S, index, unicode) {
      return index + (unicode ? charAt$1(S, index).length : 1);
    };

    var TypeError$1 = global$2.TypeError;

    // `RegExpExec` abstract operation
    // https://tc39.es/ecma262/#sec-regexpexec
    var regexpExecAbstract = function (R, S) {
      var exec = R.exec;
      if (isCallable(exec)) {
        var result = functionCall(exec, R, S);
        if (result !== null) anObject(result);
        return result;
      }
      if (classofRaw(R) === 'RegExp') return functionCall(regexpExec, R, S);
      throw TypeError$1('RegExp#exec called on incompatible receiver');
    };

    // @@match logic
    fixRegexpWellKnownSymbolLogic('match', function (MATCH, nativeMatch, maybeCallNative) {
      return [
        // `String.prototype.match` method
        // https://tc39.es/ecma262/#sec-string.prototype.match
        function match(regexp) {
          var O = requireObjectCoercible(this);
          var matcher = regexp == undefined ? undefined : getMethod(regexp, MATCH);
          return matcher ? functionCall(matcher, regexp, O) : new RegExp(regexp)[MATCH](toString(O));
        },
        // `RegExp.prototype[@@match]` method
        // https://tc39.es/ecma262/#sec-regexp.prototype-@@match
        function (string) {
          var rx = anObject(this);
          var S = toString(string);
          var res = maybeCallNative(nativeMatch, rx, S);

          if (res.done) return res.value;

          if (!rx.global) return regexpExecAbstract(rx, S);

          var fullUnicode = rx.unicode;
          rx.lastIndex = 0;
          var A = [];
          var n = 0;
          var result;
          while ((result = regexpExecAbstract(rx, S)) !== null) {
            var matchStr = toString(result[0]);
            A[n] = matchStr;
            if (matchStr === '') rx.lastIndex = advanceStringIndex(S, toLength(rx.lastIndex), fullUnicode);
            n++;
          }
          return n === 0 ? null : A;
        }
      ];
    });

    var FunctionPrototype = Function.prototype;
    var apply = FunctionPrototype.apply;
    var bind = FunctionPrototype.bind;
    var call = FunctionPrototype.call;

    // eslint-disable-next-line es/no-reflect -- safe
    var functionApply = typeof Reflect == 'object' && Reflect.apply || (bind ? call.bind(apply) : function () {
      return call.apply(apply, arguments);
    });

    var floor = Math.floor;
    var charAt = functionUncurryThis(''.charAt);
    var replace = functionUncurryThis(''.replace);
    var stringSlice$1 = functionUncurryThis(''.slice);
    var SUBSTITUTION_SYMBOLS = /\$([$&'`]|\d{1,2}|<[^>]*>)/g;
    var SUBSTITUTION_SYMBOLS_NO_NAMED = /\$([$&'`]|\d{1,2})/g;

    // `GetSubstitution` abstract operation
    // https://tc39.es/ecma262/#sec-getsubstitution
    var getSubstitution = function (matched, str, position, captures, namedCaptures, replacement) {
      var tailPos = position + matched.length;
      var m = captures.length;
      var symbols = SUBSTITUTION_SYMBOLS_NO_NAMED;
      if (namedCaptures !== undefined) {
        namedCaptures = toObject(namedCaptures);
        symbols = SUBSTITUTION_SYMBOLS;
      }
      return replace(replacement, symbols, function (match, ch) {
        var capture;
        switch (charAt(ch, 0)) {
          case '$': return '$';
          case '&': return matched;
          case '`': return stringSlice$1(str, 0, position);
          case "'": return stringSlice$1(str, tailPos);
          case '<':
            capture = namedCaptures[stringSlice$1(ch, 1, -1)];
            break;
          default: // \d\d?
            var n = +ch;
            if (n === 0) return match;
            if (n > m) {
              var f = floor(n / 10);
              if (f === 0) return match;
              if (f <= m) return captures[f - 1] === undefined ? charAt(ch, 1) : captures[f - 1] + charAt(ch, 1);
              return match;
            }
            capture = captures[n - 1];
        }
        return capture === undefined ? '' : capture;
      });
    };

    var REPLACE = wellKnownSymbol('replace');
    var max = Math.max;
    var min = Math.min;
    var concat = functionUncurryThis([].concat);
    var push = functionUncurryThis([].push);
    var stringIndexOf = functionUncurryThis(''.indexOf);
    var stringSlice = functionUncurryThis(''.slice);

    var maybeToString = function (it) {
      return it === undefined ? it : String(it);
    };

    // IE <= 11 replaces $0 with the whole match, as if it was $&
    // https://stackoverflow.com/questions/6024666/getting-ie-to-replace-a-regex-with-the-literal-string-0
    var REPLACE_KEEPS_$0 = (function () {
      // eslint-disable-next-line regexp/prefer-escape-replacement-dollar-char -- required for testing
      return 'a'.replace(/./, '$0') === '$0';
    })();

    // Safari <= 13.0.3(?) substitutes nth capture where n>m with an empty string
    var REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE = (function () {
      if (/./[REPLACE]) {
        return /./[REPLACE]('a', '$0') === '';
      }
      return false;
    })();

    var REPLACE_SUPPORTS_NAMED_GROUPS = !fails(function () {
      var re = /./;
      re.exec = function () {
        var result = [];
        result.groups = { a: '7' };
        return result;
      };
      // eslint-disable-next-line regexp/no-useless-dollar-replacements -- false positive
      return ''.replace(re, '$<a>') !== '7';
    });

    // @@replace logic
    fixRegexpWellKnownSymbolLogic('replace', function (_, nativeReplace, maybeCallNative) {
      var UNSAFE_SUBSTITUTE = REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE ? '$' : '$0';

      return [
        // `String.prototype.replace` method
        // https://tc39.es/ecma262/#sec-string.prototype.replace
        function replace(searchValue, replaceValue) {
          var O = requireObjectCoercible(this);
          var replacer = searchValue == undefined ? undefined : getMethod(searchValue, REPLACE);
          return replacer
            ? functionCall(replacer, searchValue, O, replaceValue)
            : functionCall(nativeReplace, toString(O), searchValue, replaceValue);
        },
        // `RegExp.prototype[@@replace]` method
        // https://tc39.es/ecma262/#sec-regexp.prototype-@@replace
        function (string, replaceValue) {
          var rx = anObject(this);
          var S = toString(string);

          if (
            typeof replaceValue == 'string' &&
            stringIndexOf(replaceValue, UNSAFE_SUBSTITUTE) === -1 &&
            stringIndexOf(replaceValue, '$<') === -1
          ) {
            var res = maybeCallNative(nativeReplace, rx, S, replaceValue);
            if (res.done) return res.value;
          }

          var functionalReplace = isCallable(replaceValue);
          if (!functionalReplace) replaceValue = toString(replaceValue);

          var global = rx.global;
          if (global) {
            var fullUnicode = rx.unicode;
            rx.lastIndex = 0;
          }
          var results = [];
          while (true) {
            var result = regexpExecAbstract(rx, S);
            if (result === null) break;

            push(results, result);
            if (!global) break;

            var matchStr = toString(result[0]);
            if (matchStr === '') rx.lastIndex = advanceStringIndex(S, toLength(rx.lastIndex), fullUnicode);
          }

          var accumulatedResult = '';
          var nextSourcePosition = 0;
          for (var i = 0; i < results.length; i++) {
            result = results[i];

            var matched = toString(result[0]);
            var position = max(min(toIntegerOrInfinity(result.index), S.length), 0);
            var captures = [];
            // NOTE: This is equivalent to
            //   captures = result.slice(1).map(maybeToString)
            // but for some reason `nativeSlice.call(result, 1, result.length)` (called in
            // the slice polyfill when slicing native arrays) "doesn't work" in safari 9 and
            // causes a crash (https://pastebin.com/N21QzeQA) when trying to debug it.
            for (var j = 1; j < result.length; j++) push(captures, maybeToString(result[j]));
            var namedCaptures = result.groups;
            if (functionalReplace) {
              var replacerArgs = concat([matched], captures, position, S);
              if (namedCaptures !== undefined) push(replacerArgs, namedCaptures);
              var replacement = toString(functionApply(replaceValue, undefined, replacerArgs));
            } else {
              replacement = getSubstitution(matched, S, position, captures, namedCaptures, replaceValue);
            }
            if (position >= nextSourcePosition) {
              accumulatedResult += stringSlice(S, nextSourcePosition, position) + replacement;
              nextSourcePosition = position + matched.length;
            }
          }
          return accumulatedResult + stringSlice(S, nextSourcePosition);
        }
      ];
    }, !REPLACE_SUPPORTS_NAMED_GROUPS || !REPLACE_KEEPS_$0 || REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE);

    /**
     * SimpleBar.js - v5.3.6
     * Scrollbars, simpler.
     * https://grsmto.github.io/simplebar/
     *
     * Made by Adrien Denat from a fork by Jonathan Nicol
     * Under MIT License
     */

    // Helper function to retrieve options from element attributes
    var getOptions = function getOptions(obj) {
      var options = Array.prototype.reduce.call(obj, function (acc, attribute) {
        var option = attribute.name.match(/data-simplebar-(.+)/);

        if (option) {
          var key = option[1].replace(/\W+(.)/g, function (x, chr) {
            return chr.toUpperCase();
          });

          switch (attribute.value) {
            case 'true':
              acc[key] = true;
              break;

            case 'false':
              acc[key] = false;
              break;

            case undefined:
              acc[key] = true;
              break;

            default:
              acc[key] = attribute.value;
          }
        }

        return acc;
      }, {});
      return options;
    };
    function getElementWindow(element) {
      if (!element || !element.ownerDocument || !element.ownerDocument.defaultView) {
        return window;
      }

      return element.ownerDocument.defaultView;
    }
    function getElementDocument(element) {
      if (!element || !element.ownerDocument) {
        return document;
      }

      return element.ownerDocument;
    }

    var cachedScrollbarWidth = null;
    var cachedDevicePixelRatio = null;

    if (canUseDom) {
      window.addEventListener('resize', function () {
        if (cachedDevicePixelRatio !== window.devicePixelRatio) {
          cachedDevicePixelRatio = window.devicePixelRatio;
          cachedScrollbarWidth = null;
        }
      });
    }

    function scrollbarWidth(el) {
      if (cachedScrollbarWidth === null) {
        var document = getElementDocument(el);

        if (typeof document === 'undefined') {
          cachedScrollbarWidth = 0;
          return cachedScrollbarWidth;
        }

        var body = document.body;
        var box = document.createElement('div');
        box.classList.add('simplebar-hide-scrollbar');
        body.appendChild(box);
        var width = box.getBoundingClientRect().right;
        body.removeChild(box);
        cachedScrollbarWidth = width;
      }

      return cachedScrollbarWidth;
    }

    var SimpleBar =
    /*#__PURE__*/
    function () {
      function SimpleBar(element, options) {
        var _this = this;

        this.onScroll = function () {
          var elWindow = getElementWindow(_this.el);

          if (!_this.scrollXTicking) {
            elWindow.requestAnimationFrame(_this.scrollX);
            _this.scrollXTicking = true;
          }

          if (!_this.scrollYTicking) {
            elWindow.requestAnimationFrame(_this.scrollY);
            _this.scrollYTicking = true;
          }
        };

        this.scrollX = function () {
          if (_this.axis.x.isOverflowing) {
            _this.showScrollbar('x');

            _this.positionScrollbar('x');
          }

          _this.scrollXTicking = false;
        };

        this.scrollY = function () {
          if (_this.axis.y.isOverflowing) {
            _this.showScrollbar('y');

            _this.positionScrollbar('y');
          }

          _this.scrollYTicking = false;
        };

        this.onMouseEnter = function () {
          _this.showScrollbar('x');

          _this.showScrollbar('y');
        };

        this.onMouseMove = function (e) {
          _this.mouseX = e.clientX;
          _this.mouseY = e.clientY;

          if (_this.axis.x.isOverflowing || _this.axis.x.forceVisible) {
            _this.onMouseMoveForAxis('x');
          }

          if (_this.axis.y.isOverflowing || _this.axis.y.forceVisible) {
            _this.onMouseMoveForAxis('y');
          }
        };

        this.onMouseLeave = function () {
          _this.onMouseMove.cancel();

          if (_this.axis.x.isOverflowing || _this.axis.x.forceVisible) {
            _this.onMouseLeaveForAxis('x');
          }

          if (_this.axis.y.isOverflowing || _this.axis.y.forceVisible) {
            _this.onMouseLeaveForAxis('y');
          }

          _this.mouseX = -1;
          _this.mouseY = -1;
        };

        this.onWindowResize = function () {
          // Recalculate scrollbarWidth in case it's a zoom
          _this.scrollbarWidth = _this.getScrollbarWidth();

          _this.hideNativeScrollbar();
        };

        this.hideScrollbars = function () {
          _this.axis.x.track.rect = _this.axis.x.track.el.getBoundingClientRect();
          _this.axis.y.track.rect = _this.axis.y.track.el.getBoundingClientRect();

          if (!_this.isWithinBounds(_this.axis.y.track.rect)) {
            _this.axis.y.scrollbar.el.classList.remove(_this.classNames.visible);

            _this.axis.y.isVisible = false;
          }

          if (!_this.isWithinBounds(_this.axis.x.track.rect)) {
            _this.axis.x.scrollbar.el.classList.remove(_this.classNames.visible);

            _this.axis.x.isVisible = false;
          }
        };

        this.onPointerEvent = function (e) {
          var isWithinTrackXBounds, isWithinTrackYBounds;
          _this.axis.x.track.rect = _this.axis.x.track.el.getBoundingClientRect();
          _this.axis.y.track.rect = _this.axis.y.track.el.getBoundingClientRect();

          if (_this.axis.x.isOverflowing || _this.axis.x.forceVisible) {
            isWithinTrackXBounds = _this.isWithinBounds(_this.axis.x.track.rect);
          }

          if (_this.axis.y.isOverflowing || _this.axis.y.forceVisible) {
            isWithinTrackYBounds = _this.isWithinBounds(_this.axis.y.track.rect);
          } // If any pointer event is called on the scrollbar


          if (isWithinTrackXBounds || isWithinTrackYBounds) {
            // Preventing the event's default action stops text being
            // selectable during the drag.
            e.preventDefault(); // Prevent event leaking

            e.stopPropagation();

            if (e.type === 'mousedown') {
              if (isWithinTrackXBounds) {
                _this.axis.x.scrollbar.rect = _this.axis.x.scrollbar.el.getBoundingClientRect();

                if (_this.isWithinBounds(_this.axis.x.scrollbar.rect)) {
                  _this.onDragStart(e, 'x');
                } else {
                  _this.onTrackClick(e, 'x');
                }
              }

              if (isWithinTrackYBounds) {
                _this.axis.y.scrollbar.rect = _this.axis.y.scrollbar.el.getBoundingClientRect();

                if (_this.isWithinBounds(_this.axis.y.scrollbar.rect)) {
                  _this.onDragStart(e, 'y');
                } else {
                  _this.onTrackClick(e, 'y');
                }
              }
            }
          }
        };

        this.drag = function (e) {
          var eventOffset;
          var track = _this.axis[_this.draggedAxis].track;
          var trackSize = track.rect[_this.axis[_this.draggedAxis].sizeAttr];
          var scrollbar = _this.axis[_this.draggedAxis].scrollbar;
          var contentSize = _this.contentWrapperEl[_this.axis[_this.draggedAxis].scrollSizeAttr];
          var hostSize = parseInt(_this.elStyles[_this.axis[_this.draggedAxis].sizeAttr], 10);
          e.preventDefault();
          e.stopPropagation();

          if (_this.draggedAxis === 'y') {
            eventOffset = e.pageY;
          } else {
            eventOffset = e.pageX;
          } // Calculate how far the user's mouse is from the top/left of the scrollbar (minus the dragOffset).


          var dragPos = eventOffset - track.rect[_this.axis[_this.draggedAxis].offsetAttr] - _this.axis[_this.draggedAxis].dragOffset; // Convert the mouse position into a percentage of the scrollbar height/width.

          var dragPerc = dragPos / (trackSize - scrollbar.size); // Scroll the content by the same percentage.

          var scrollPos = dragPerc * (contentSize - hostSize); // Fix browsers inconsistency on RTL

          if (_this.draggedAxis === 'x') {
            scrollPos = _this.isRtl && SimpleBar.getRtlHelpers().isRtlScrollbarInverted ? scrollPos - (trackSize + scrollbar.size) : scrollPos;
            scrollPos = _this.isRtl && SimpleBar.getRtlHelpers().isRtlScrollingInverted ? -scrollPos : scrollPos;
          }

          _this.contentWrapperEl[_this.axis[_this.draggedAxis].scrollOffsetAttr] = scrollPos;
        };

        this.onEndDrag = function (e) {
          var elDocument = getElementDocument(_this.el);
          var elWindow = getElementWindow(_this.el);
          e.preventDefault();
          e.stopPropagation();

          _this.el.classList.remove(_this.classNames.dragging);

          elDocument.removeEventListener('mousemove', _this.drag, true);
          elDocument.removeEventListener('mouseup', _this.onEndDrag, true);
          _this.removePreventClickId = elWindow.setTimeout(function () {
            // Remove these asynchronously so we still suppress click events
            // generated simultaneously with mouseup.
            elDocument.removeEventListener('click', _this.preventClick, true);
            elDocument.removeEventListener('dblclick', _this.preventClick, true);
            _this.removePreventClickId = null;
          });
        };

        this.preventClick = function (e) {
          e.preventDefault();
          e.stopPropagation();
        };

        this.el = element;
        this.minScrollbarWidth = 20;
        this.options = Object.assign({}, SimpleBar.defaultOptions, {}, options);
        this.classNames = Object.assign({}, SimpleBar.defaultOptions.classNames, {}, this.options.classNames);
        this.axis = {
          x: {
            scrollOffsetAttr: 'scrollLeft',
            sizeAttr: 'width',
            scrollSizeAttr: 'scrollWidth',
            offsetSizeAttr: 'offsetWidth',
            offsetAttr: 'left',
            overflowAttr: 'overflowX',
            dragOffset: 0,
            isOverflowing: true,
            isVisible: false,
            forceVisible: false,
            track: {},
            scrollbar: {}
          },
          y: {
            scrollOffsetAttr: 'scrollTop',
            sizeAttr: 'height',
            scrollSizeAttr: 'scrollHeight',
            offsetSizeAttr: 'offsetHeight',
            offsetAttr: 'top',
            overflowAttr: 'overflowY',
            dragOffset: 0,
            isOverflowing: true,
            isVisible: false,
            forceVisible: false,
            track: {},
            scrollbar: {}
          }
        };
        this.removePreventClickId = null; // Don't re-instantiate over an existing one

        if (SimpleBar.instances.has(this.el)) {
          return;
        }

        this.recalculate = lodash_throttle(this.recalculate.bind(this), 64);
        this.onMouseMove = lodash_throttle(this.onMouseMove.bind(this), 64);
        this.hideScrollbars = lodash_debounce(this.hideScrollbars.bind(this), this.options.timeout);
        this.onWindowResize = lodash_debounce(this.onWindowResize.bind(this), 64, {
          leading: true
        });
        SimpleBar.getRtlHelpers = lodash_memoize(SimpleBar.getRtlHelpers);
        this.init();
      }
      /**
       * Static properties
       */

      /**
       * Helper to fix browsers inconsistency on RTL:
       *  - Firefox inverts the scrollbar initial position
       *  - IE11 inverts both scrollbar position and scrolling offset
       * Directly inspired by @KingSora's OverlayScrollbars https://github.com/KingSora/OverlayScrollbars/blob/master/js/OverlayScrollbars.js#L1634
       */


      SimpleBar.getRtlHelpers = function getRtlHelpers() {
        var dummyDiv = document.createElement('div');
        dummyDiv.innerHTML = '<div class="hs-dummy-scrollbar-size"><div style="height: 200%; width: 200%; margin: 10px 0;"></div></div>';
        var scrollbarDummyEl = dummyDiv.firstElementChild;
        document.body.appendChild(scrollbarDummyEl);
        var dummyContainerChild = scrollbarDummyEl.firstElementChild;
        scrollbarDummyEl.scrollLeft = 0;
        var dummyContainerOffset = SimpleBar.getOffset(scrollbarDummyEl);
        var dummyContainerChildOffset = SimpleBar.getOffset(dummyContainerChild);
        scrollbarDummyEl.scrollLeft = 999;
        var dummyContainerScrollOffsetAfterScroll = SimpleBar.getOffset(dummyContainerChild);
        return {
          // determines if the scrolling is responding with negative values
          isRtlScrollingInverted: dummyContainerOffset.left !== dummyContainerChildOffset.left && dummyContainerChildOffset.left - dummyContainerScrollOffsetAfterScroll.left !== 0,
          // determines if the origin scrollbar position is inverted or not (positioned on left or right)
          isRtlScrollbarInverted: dummyContainerOffset.left !== dummyContainerChildOffset.left
        };
      };

      SimpleBar.getOffset = function getOffset(el) {
        var rect = el.getBoundingClientRect();
        var elDocument = getElementDocument(el);
        var elWindow = getElementWindow(el);
        return {
          top: rect.top + (elWindow.pageYOffset || elDocument.documentElement.scrollTop),
          left: rect.left + (elWindow.pageXOffset || elDocument.documentElement.scrollLeft)
        };
      };

      var _proto = SimpleBar.prototype;

      _proto.init = function init() {
        // Save a reference to the instance, so we know this DOM node has already been instancied
        SimpleBar.instances.set(this.el, this); // We stop here on server-side

        if (canUseDom) {
          this.initDOM();
          this.setAccessibilityAttributes();
          this.scrollbarWidth = this.getScrollbarWidth();
          this.recalculate();
          this.initListeners();
        }
      };

      _proto.initDOM = function initDOM() {
        var _this2 = this;

        // make sure this element doesn't have the elements yet
        if (Array.prototype.filter.call(this.el.children, function (child) {
          return child.classList.contains(_this2.classNames.wrapper);
        }).length) {
          // assume that element has his DOM already initiated
          this.wrapperEl = this.el.querySelector("." + this.classNames.wrapper);
          this.contentWrapperEl = this.options.scrollableNode || this.el.querySelector("." + this.classNames.contentWrapper);
          this.contentEl = this.options.contentNode || this.el.querySelector("." + this.classNames.contentEl);
          this.offsetEl = this.el.querySelector("." + this.classNames.offset);
          this.maskEl = this.el.querySelector("." + this.classNames.mask);
          this.placeholderEl = this.findChild(this.wrapperEl, "." + this.classNames.placeholder);
          this.heightAutoObserverWrapperEl = this.el.querySelector("." + this.classNames.heightAutoObserverWrapperEl);
          this.heightAutoObserverEl = this.el.querySelector("." + this.classNames.heightAutoObserverEl);
          this.axis.x.track.el = this.findChild(this.el, "." + this.classNames.track + "." + this.classNames.horizontal);
          this.axis.y.track.el = this.findChild(this.el, "." + this.classNames.track + "." + this.classNames.vertical);
        } else {
          // Prepare DOM
          this.wrapperEl = document.createElement('div');
          this.contentWrapperEl = document.createElement('div');
          this.offsetEl = document.createElement('div');
          this.maskEl = document.createElement('div');
          this.contentEl = document.createElement('div');
          this.placeholderEl = document.createElement('div');
          this.heightAutoObserverWrapperEl = document.createElement('div');
          this.heightAutoObserverEl = document.createElement('div');
          this.wrapperEl.classList.add(this.classNames.wrapper);
          this.contentWrapperEl.classList.add(this.classNames.contentWrapper);
          this.offsetEl.classList.add(this.classNames.offset);
          this.maskEl.classList.add(this.classNames.mask);
          this.contentEl.classList.add(this.classNames.contentEl);
          this.placeholderEl.classList.add(this.classNames.placeholder);
          this.heightAutoObserverWrapperEl.classList.add(this.classNames.heightAutoObserverWrapperEl);
          this.heightAutoObserverEl.classList.add(this.classNames.heightAutoObserverEl);

          while (this.el.firstChild) {
            this.contentEl.appendChild(this.el.firstChild);
          }

          this.contentWrapperEl.appendChild(this.contentEl);
          this.offsetEl.appendChild(this.contentWrapperEl);
          this.maskEl.appendChild(this.offsetEl);
          this.heightAutoObserverWrapperEl.appendChild(this.heightAutoObserverEl);
          this.wrapperEl.appendChild(this.heightAutoObserverWrapperEl);
          this.wrapperEl.appendChild(this.maskEl);
          this.wrapperEl.appendChild(this.placeholderEl);
          this.el.appendChild(this.wrapperEl);
        }

        if (!this.axis.x.track.el || !this.axis.y.track.el) {
          var track = document.createElement('div');
          var scrollbar = document.createElement('div');
          track.classList.add(this.classNames.track);
          scrollbar.classList.add(this.classNames.scrollbar);
          track.appendChild(scrollbar);
          this.axis.x.track.el = track.cloneNode(true);
          this.axis.x.track.el.classList.add(this.classNames.horizontal);
          this.axis.y.track.el = track.cloneNode(true);
          this.axis.y.track.el.classList.add(this.classNames.vertical);
          this.el.appendChild(this.axis.x.track.el);
          this.el.appendChild(this.axis.y.track.el);
        }

        this.axis.x.scrollbar.el = this.axis.x.track.el.querySelector("." + this.classNames.scrollbar);
        this.axis.y.scrollbar.el = this.axis.y.track.el.querySelector("." + this.classNames.scrollbar);

        if (!this.options.autoHide) {
          this.axis.x.scrollbar.el.classList.add(this.classNames.visible);
          this.axis.y.scrollbar.el.classList.add(this.classNames.visible);
        }

        this.el.setAttribute('data-simplebar', 'init');
      };

      _proto.setAccessibilityAttributes = function setAccessibilityAttributes() {
        var ariaLabel = this.options.ariaLabel || 'scrollable content';
        this.contentWrapperEl.setAttribute('tabindex', '0');
        this.contentWrapperEl.setAttribute('role', 'region');
        this.contentWrapperEl.setAttribute('aria-label', ariaLabel);
      };

      _proto.initListeners = function initListeners() {
        var _this3 = this;

        var elWindow = getElementWindow(this.el); // Event listeners

        if (this.options.autoHide) {
          this.el.addEventListener('mouseenter', this.onMouseEnter);
        }

        ['mousedown', 'click', 'dblclick'].forEach(function (e) {
          _this3.el.addEventListener(e, _this3.onPointerEvent, true);
        });
        ['touchstart', 'touchend', 'touchmove'].forEach(function (e) {
          _this3.el.addEventListener(e, _this3.onPointerEvent, {
            capture: true,
            passive: true
          });
        });
        this.el.addEventListener('mousemove', this.onMouseMove);
        this.el.addEventListener('mouseleave', this.onMouseLeave);
        this.contentWrapperEl.addEventListener('scroll', this.onScroll); // Browser zoom triggers a window resize

        elWindow.addEventListener('resize', this.onWindowResize); // Hack for https://github.com/WICG/ResizeObserver/issues/38

        var resizeObserverStarted = false;
        var resizeObserver = elWindow.ResizeObserver || ResizeObserver;
        this.resizeObserver = new resizeObserver(function () {
          if (!resizeObserverStarted) return;

          _this3.recalculate();
        });
        this.resizeObserver.observe(this.el);
        this.resizeObserver.observe(this.contentEl);
        elWindow.requestAnimationFrame(function () {
          resizeObserverStarted = true;
        }); // This is required to detect horizontal scroll. Vertical scroll only needs the resizeObserver.

        this.mutationObserver = new elWindow.MutationObserver(this.recalculate);
        this.mutationObserver.observe(this.contentEl, {
          childList: true,
          subtree: true,
          characterData: true
        });
      };

      _proto.recalculate = function recalculate() {
        var elWindow = getElementWindow(this.el);
        this.elStyles = elWindow.getComputedStyle(this.el);
        this.isRtl = this.elStyles.direction === 'rtl';
        var isHeightAuto = this.heightAutoObserverEl.offsetHeight <= 1;
        var isWidthAuto = this.heightAutoObserverEl.offsetWidth <= 1;
        var contentElOffsetWidth = this.contentEl.offsetWidth;
        var contentWrapperElOffsetWidth = this.contentWrapperEl.offsetWidth;
        var elOverflowX = this.elStyles.overflowX;
        var elOverflowY = this.elStyles.overflowY;
        this.contentEl.style.padding = this.elStyles.paddingTop + " " + this.elStyles.paddingRight + " " + this.elStyles.paddingBottom + " " + this.elStyles.paddingLeft;
        this.wrapperEl.style.margin = "-" + this.elStyles.paddingTop + " -" + this.elStyles.paddingRight + " -" + this.elStyles.paddingBottom + " -" + this.elStyles.paddingLeft;
        var contentElScrollHeight = this.contentEl.scrollHeight;
        var contentElScrollWidth = this.contentEl.scrollWidth;
        this.contentWrapperEl.style.height = isHeightAuto ? 'auto' : '100%'; // Determine placeholder size

        this.placeholderEl.style.width = isWidthAuto ? contentElOffsetWidth + "px" : 'auto';
        this.placeholderEl.style.height = contentElScrollHeight + "px";
        var contentWrapperElOffsetHeight = this.contentWrapperEl.offsetHeight;
        this.axis.x.isOverflowing = contentElScrollWidth > contentElOffsetWidth;
        this.axis.y.isOverflowing = contentElScrollHeight > contentWrapperElOffsetHeight; // Set isOverflowing to false if user explicitely set hidden overflow

        this.axis.x.isOverflowing = elOverflowX === 'hidden' ? false : this.axis.x.isOverflowing;
        this.axis.y.isOverflowing = elOverflowY === 'hidden' ? false : this.axis.y.isOverflowing;
        this.axis.x.forceVisible = this.options.forceVisible === 'x' || this.options.forceVisible === true;
        this.axis.y.forceVisible = this.options.forceVisible === 'y' || this.options.forceVisible === true;
        this.hideNativeScrollbar(); // Set isOverflowing to false if scrollbar is not necessary (content is shorter than offset)

        var offsetForXScrollbar = this.axis.x.isOverflowing ? this.scrollbarWidth : 0;
        var offsetForYScrollbar = this.axis.y.isOverflowing ? this.scrollbarWidth : 0;
        this.axis.x.isOverflowing = this.axis.x.isOverflowing && contentElScrollWidth > contentWrapperElOffsetWidth - offsetForYScrollbar;
        this.axis.y.isOverflowing = this.axis.y.isOverflowing && contentElScrollHeight > contentWrapperElOffsetHeight - offsetForXScrollbar;
        this.axis.x.scrollbar.size = this.getScrollbarSize('x');
        this.axis.y.scrollbar.size = this.getScrollbarSize('y');
        this.axis.x.scrollbar.el.style.width = this.axis.x.scrollbar.size + "px";
        this.axis.y.scrollbar.el.style.height = this.axis.y.scrollbar.size + "px";
        this.positionScrollbar('x');
        this.positionScrollbar('y');
        this.toggleTrackVisibility('x');
        this.toggleTrackVisibility('y');
      }
      /**
       * Calculate scrollbar size
       */
      ;

      _proto.getScrollbarSize = function getScrollbarSize(axis) {
        if (axis === void 0) {
          axis = 'y';
        }

        if (!this.axis[axis].isOverflowing) {
          return 0;
        }

        var contentSize = this.contentEl[this.axis[axis].scrollSizeAttr];
        var trackSize = this.axis[axis].track.el[this.axis[axis].offsetSizeAttr];
        var scrollbarSize;
        var scrollbarRatio = trackSize / contentSize; // Calculate new height/position of drag handle.

        scrollbarSize = Math.max(~~(scrollbarRatio * trackSize), this.options.scrollbarMinSize);

        if (this.options.scrollbarMaxSize) {
          scrollbarSize = Math.min(scrollbarSize, this.options.scrollbarMaxSize);
        }

        return scrollbarSize;
      };

      _proto.positionScrollbar = function positionScrollbar(axis) {
        if (axis === void 0) {
          axis = 'y';
        }

        if (!this.axis[axis].isOverflowing) {
          return;
        }

        var contentSize = this.contentWrapperEl[this.axis[axis].scrollSizeAttr];
        var trackSize = this.axis[axis].track.el[this.axis[axis].offsetSizeAttr];
        var hostSize = parseInt(this.elStyles[this.axis[axis].sizeAttr], 10);
        var scrollbar = this.axis[axis].scrollbar;
        var scrollOffset = this.contentWrapperEl[this.axis[axis].scrollOffsetAttr];
        scrollOffset = axis === 'x' && this.isRtl && SimpleBar.getRtlHelpers().isRtlScrollingInverted ? -scrollOffset : scrollOffset;
        var scrollPourcent = scrollOffset / (contentSize - hostSize);
        var handleOffset = ~~((trackSize - scrollbar.size) * scrollPourcent);
        handleOffset = axis === 'x' && this.isRtl && SimpleBar.getRtlHelpers().isRtlScrollbarInverted ? handleOffset + (trackSize - scrollbar.size) : handleOffset;
        scrollbar.el.style.transform = axis === 'x' ? "translate3d(" + handleOffset + "px, 0, 0)" : "translate3d(0, " + handleOffset + "px, 0)";
      };

      _proto.toggleTrackVisibility = function toggleTrackVisibility(axis) {
        if (axis === void 0) {
          axis = 'y';
        }

        var track = this.axis[axis].track.el;
        var scrollbar = this.axis[axis].scrollbar.el;

        if (this.axis[axis].isOverflowing || this.axis[axis].forceVisible) {
          track.style.visibility = 'visible';
          this.contentWrapperEl.style[this.axis[axis].overflowAttr] = 'scroll';
        } else {
          track.style.visibility = 'hidden';
          this.contentWrapperEl.style[this.axis[axis].overflowAttr] = 'hidden';
        } // Even if forceVisible is enabled, scrollbar itself should be hidden


        if (this.axis[axis].isOverflowing) {
          scrollbar.style.display = 'block';
        } else {
          scrollbar.style.display = 'none';
        }
      };

      _proto.hideNativeScrollbar = function hideNativeScrollbar() {
        this.offsetEl.style[this.isRtl ? 'left' : 'right'] = this.axis.y.isOverflowing || this.axis.y.forceVisible ? "-" + this.scrollbarWidth + "px" : 0;
        this.offsetEl.style.bottom = this.axis.x.isOverflowing || this.axis.x.forceVisible ? "-" + this.scrollbarWidth + "px" : 0;
      }
      /**
       * On scroll event handling
       */
      ;

      _proto.onMouseMoveForAxis = function onMouseMoveForAxis(axis) {
        if (axis === void 0) {
          axis = 'y';
        }

        this.axis[axis].track.rect = this.axis[axis].track.el.getBoundingClientRect();
        this.axis[axis].scrollbar.rect = this.axis[axis].scrollbar.el.getBoundingClientRect();
        var isWithinScrollbarBoundsX = this.isWithinBounds(this.axis[axis].scrollbar.rect);

        if (isWithinScrollbarBoundsX) {
          this.axis[axis].scrollbar.el.classList.add(this.classNames.hover);
        } else {
          this.axis[axis].scrollbar.el.classList.remove(this.classNames.hover);
        }

        if (this.isWithinBounds(this.axis[axis].track.rect)) {
          this.showScrollbar(axis);
          this.axis[axis].track.el.classList.add(this.classNames.hover);
        } else {
          this.axis[axis].track.el.classList.remove(this.classNames.hover);
        }
      };

      _proto.onMouseLeaveForAxis = function onMouseLeaveForAxis(axis) {
        if (axis === void 0) {
          axis = 'y';
        }

        this.axis[axis].track.el.classList.remove(this.classNames.hover);
        this.axis[axis].scrollbar.el.classList.remove(this.classNames.hover);
      };

      /**
       * Show scrollbar
       */
      _proto.showScrollbar = function showScrollbar(axis) {
        if (axis === void 0) {
          axis = 'y';
        }

        var scrollbar = this.axis[axis].scrollbar.el;

        if (!this.axis[axis].isVisible) {
          scrollbar.classList.add(this.classNames.visible);
          this.axis[axis].isVisible = true;
        }

        if (this.options.autoHide) {
          this.hideScrollbars();
        }
      }
      /**
       * Hide Scrollbar
       */
      ;

      /**
       * on scrollbar handle drag movement starts
       */
      _proto.onDragStart = function onDragStart(e, axis) {
        if (axis === void 0) {
          axis = 'y';
        }

        var elDocument = getElementDocument(this.el);
        var elWindow = getElementWindow(this.el);
        var scrollbar = this.axis[axis].scrollbar; // Measure how far the user's mouse is from the top of the scrollbar drag handle.

        var eventOffset = axis === 'y' ? e.pageY : e.pageX;
        this.axis[axis].dragOffset = eventOffset - scrollbar.rect[this.axis[axis].offsetAttr];
        this.draggedAxis = axis;
        this.el.classList.add(this.classNames.dragging);
        elDocument.addEventListener('mousemove', this.drag, true);
        elDocument.addEventListener('mouseup', this.onEndDrag, true);

        if (this.removePreventClickId === null) {
          elDocument.addEventListener('click', this.preventClick, true);
          elDocument.addEventListener('dblclick', this.preventClick, true);
        } else {
          elWindow.clearTimeout(this.removePreventClickId);
          this.removePreventClickId = null;
        }
      }
      /**
       * Drag scrollbar handle
       */
      ;

      _proto.onTrackClick = function onTrackClick(e, axis) {
        var _this4 = this;

        if (axis === void 0) {
          axis = 'y';
        }

        if (!this.options.clickOnTrack) return;
        var elWindow = getElementWindow(this.el);
        this.axis[axis].scrollbar.rect = this.axis[axis].scrollbar.el.getBoundingClientRect();
        var scrollbar = this.axis[axis].scrollbar;
        var scrollbarOffset = scrollbar.rect[this.axis[axis].offsetAttr];
        var hostSize = parseInt(this.elStyles[this.axis[axis].sizeAttr], 10);
        var scrolled = this.contentWrapperEl[this.axis[axis].scrollOffsetAttr];
        var t = axis === 'y' ? this.mouseY - scrollbarOffset : this.mouseX - scrollbarOffset;
        var dir = t < 0 ? -1 : 1;
        var scrollSize = dir === -1 ? scrolled - hostSize : scrolled + hostSize;

        var scrollTo = function scrollTo() {
          if (dir === -1) {
            if (scrolled > scrollSize) {
              var _this4$contentWrapper;

              scrolled -= _this4.options.clickOnTrackSpeed;

              _this4.contentWrapperEl.scrollTo((_this4$contentWrapper = {}, _this4$contentWrapper[_this4.axis[axis].offsetAttr] = scrolled, _this4$contentWrapper));

              elWindow.requestAnimationFrame(scrollTo);
            }
          } else {
            if (scrolled < scrollSize) {
              var _this4$contentWrapper2;

              scrolled += _this4.options.clickOnTrackSpeed;

              _this4.contentWrapperEl.scrollTo((_this4$contentWrapper2 = {}, _this4$contentWrapper2[_this4.axis[axis].offsetAttr] = scrolled, _this4$contentWrapper2));

              elWindow.requestAnimationFrame(scrollTo);
            }
          }
        };

        scrollTo();
      }
      /**
       * Getter for content element
       */
      ;

      _proto.getContentElement = function getContentElement() {
        return this.contentEl;
      }
      /**
       * Getter for original scrolling element
       */
      ;

      _proto.getScrollElement = function getScrollElement() {
        return this.contentWrapperEl;
      };

      _proto.getScrollbarWidth = function getScrollbarWidth() {
        // Try/catch for FF 56 throwing on undefined computedStyles
        try {
          // Detect browsers supporting CSS scrollbar styling and do not calculate
          if (getComputedStyle(this.contentWrapperEl, '::-webkit-scrollbar').display === 'none' || 'scrollbarWidth' in document.documentElement.style || '-ms-overflow-style' in document.documentElement.style) {
            return 0;
          } else {
            return scrollbarWidth(this.el);
          }
        } catch (e) {
          return scrollbarWidth(this.el);
        }
      };

      _proto.removeListeners = function removeListeners() {
        var _this5 = this;

        var elWindow = getElementWindow(this.el); // Event listeners

        if (this.options.autoHide) {
          this.el.removeEventListener('mouseenter', this.onMouseEnter);
        }

        ['mousedown', 'click', 'dblclick'].forEach(function (e) {
          _this5.el.removeEventListener(e, _this5.onPointerEvent, true);
        });
        ['touchstart', 'touchend', 'touchmove'].forEach(function (e) {
          _this5.el.removeEventListener(e, _this5.onPointerEvent, {
            capture: true,
            passive: true
          });
        });
        this.el.removeEventListener('mousemove', this.onMouseMove);
        this.el.removeEventListener('mouseleave', this.onMouseLeave);

        if (this.contentWrapperEl) {
          this.contentWrapperEl.removeEventListener('scroll', this.onScroll);
        }

        elWindow.removeEventListener('resize', this.onWindowResize);

        if (this.mutationObserver) {
          this.mutationObserver.disconnect();
        }

        if (this.resizeObserver) {
          this.resizeObserver.disconnect();
        } // Cancel all debounced functions


        this.recalculate.cancel();
        this.onMouseMove.cancel();
        this.hideScrollbars.cancel();
        this.onWindowResize.cancel();
      }
      /**
       * UnMount mutation observer and delete SimpleBar instance from DOM element
       */
      ;

      _proto.unMount = function unMount() {
        this.removeListeners();
        SimpleBar.instances.delete(this.el);
      }
      /**
       * Check if mouse is within bounds
       */
      ;

      _proto.isWithinBounds = function isWithinBounds(bbox) {
        return this.mouseX >= bbox.left && this.mouseX <= bbox.left + bbox.width && this.mouseY >= bbox.top && this.mouseY <= bbox.top + bbox.height;
      }
      /**
       * Find element children matches query
       */
      ;

      _proto.findChild = function findChild(el, query) {
        var matches = el.matches || el.webkitMatchesSelector || el.mozMatchesSelector || el.msMatchesSelector;
        return Array.prototype.filter.call(el.children, function (child) {
          return matches.call(child, query);
        })[0];
      };

      return SimpleBar;
    }();

    SimpleBar.defaultOptions = {
      autoHide: true,
      forceVisible: false,
      clickOnTrack: true,
      clickOnTrackSpeed: 40,
      classNames: {
        contentEl: 'simplebar-content',
        contentWrapper: 'simplebar-content-wrapper',
        offset: 'simplebar-offset',
        mask: 'simplebar-mask',
        wrapper: 'simplebar-wrapper',
        placeholder: 'simplebar-placeholder',
        scrollbar: 'simplebar-scrollbar',
        track: 'simplebar-track',
        heightAutoObserverWrapperEl: 'simplebar-height-auto-observer-wrapper',
        heightAutoObserverEl: 'simplebar-height-auto-observer',
        visible: 'simplebar-visible',
        horizontal: 'simplebar-horizontal',
        vertical: 'simplebar-vertical',
        hover: 'simplebar-hover',
        dragging: 'simplebar-dragging'
      },
      scrollbarMinSize: 25,
      scrollbarMaxSize: 0,
      timeout: 1000
    };
    SimpleBar.instances = new WeakMap();

    SimpleBar.initDOMLoadedElements = function () {
      document.removeEventListener('DOMContentLoaded', this.initDOMLoadedElements);
      window.removeEventListener('load', this.initDOMLoadedElements);
      Array.prototype.forEach.call(document.querySelectorAll('[data-simplebar]'), function (el) {
        if (el.getAttribute('data-simplebar') !== 'init' && !SimpleBar.instances.has(el)) new SimpleBar(el, getOptions(el.attributes));
      });
    };

    SimpleBar.removeObserver = function () {
      this.globalObserver.disconnect();
    };

    SimpleBar.initHtmlApi = function () {
      this.initDOMLoadedElements = this.initDOMLoadedElements.bind(this); // MutationObserver is IE11+

      if (typeof MutationObserver !== 'undefined') {
        // Mutation observer to observe dynamically added elements
        this.globalObserver = new MutationObserver(SimpleBar.handleMutations);
        this.globalObserver.observe(document, {
          childList: true,
          subtree: true
        });
      } // Taken from jQuery `ready` function
      // Instantiate elements already present on the page


      if (document.readyState === 'complete' || document.readyState !== 'loading' && !document.documentElement.doScroll) {
        // Handle it asynchronously to allow scripts the opportunity to delay init
        window.setTimeout(this.initDOMLoadedElements);
      } else {
        document.addEventListener('DOMContentLoaded', this.initDOMLoadedElements);
        window.addEventListener('load', this.initDOMLoadedElements);
      }
    };

    SimpleBar.handleMutations = function (mutations) {
      mutations.forEach(function (mutation) {
        Array.prototype.forEach.call(mutation.addedNodes, function (addedNode) {
          if (addedNode.nodeType === 1) {
            if (addedNode.hasAttribute('data-simplebar')) {
              !SimpleBar.instances.has(addedNode) && document.documentElement.contains(addedNode) && new SimpleBar(addedNode, getOptions(addedNode.attributes));
            } else {
              Array.prototype.forEach.call(addedNode.querySelectorAll('[data-simplebar]'), function (el) {
                if (el.getAttribute('data-simplebar') !== 'init' && !SimpleBar.instances.has(el) && document.documentElement.contains(el)) new SimpleBar(el, getOptions(el.attributes));
              });
            }
          }
        });
        Array.prototype.forEach.call(mutation.removedNodes, function (removedNode) {
          if (removedNode.nodeType === 1) {
            if (removedNode.getAttribute('data-simplebar') === 'init') {
              SimpleBar.instances.has(removedNode) && !document.documentElement.contains(removedNode) && SimpleBar.instances.get(removedNode).unMount();
            } else {
              Array.prototype.forEach.call(removedNode.querySelectorAll('[data-simplebar="init"]'), function (el) {
                SimpleBar.instances.has(el) && !document.documentElement.contains(el) && SimpleBar.instances.get(el).unMount();
              });
            }
          }
        });
      });
    };

    SimpleBar.getOptions = getOptions;
    /**
     * HTML API
     * Called only in a browser env.
     */

    if (canUseDom) {
      SimpleBar.initHtmlApi();
    }

    /* node_modules\@woden\svelte-simplebar\src\index.svelte generated by Svelte v3.44.2 */

    function create_fragment$6(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[12].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);

    	return {
    		c() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr(div, "style", /*style*/ ctx[1]);
    			attr(div, "class", /*clazz*/ ctx[0]);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			/*div_binding*/ ctx[13](div);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[11],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[11], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*style*/ 2) {
    				attr(div, "style", /*style*/ ctx[1]);
    			}

    			if (!current || dirty & /*clazz*/ 1) {
    				attr(div, "class", /*clazz*/ ctx[0]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (default_slot) default_slot.d(detaching);
    			/*div_binding*/ ctx[13](null);
    		}
    	};
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	let element;
    	let { class: clazz } = $$props;
    	const dispatch = createEventDispatcher();
    	let simpleBar;
    	let lastScrollTop;
    	let { autoHide = true } = $$props;
    	let { scrollbarMinSize = 10 } = $$props;
    	let { scrollbarMaxSize = 0 } = $$props;

    	let { classNames = {
    		content: 'simplebar-content',
    		scrollContent: 'simplebar-scroll-content',
    		scrollbar: 'simplebar-scrollbar',
    		track: 'simplebar-track'
    	} } = $$props;

    	let { forceVisible = false } = $$props;
    	let { direction = 'ltr' } = $$props;
    	let { timeout = 1000 } = $$props;
    	let { clickOnTrack = 1000 } = $$props;
    	let { style } = $$props;

    	onMount(() => {
    		simpleBar = new SimpleBar(element,
    		{
    				autoHide,
    				scrollbarMinSize,
    				scrollbarMaxSize,
    				classNames,
    				forceVisible,
    				direction,
    				timeout,
    				clickOnTrack
    			});

    		simpleBar.getScrollElement().addEventListener('scroll', e => {
    			const st = e.target.scrollTop;

    			if (st !== lastScrollTop) {
    				if (e.target.scrollTop === 0) dispatch('scrollYReachStart');
    				if (e.target.scrollTop + e.target.clientHeight === e.target.scrollHeight) dispatch('scrollYReachEnd');
    			} else {
    				if (e.target.scrollLeft === 0) dispatch('scrollXReachStart');
    				if (e.target.scrollLeft + e.target.clientWidth === e.target.scrollWidth) dispatch('scrollXReachEnd');
    			}

    			lastScrollTop = st <= 0 ? 0 : st;
    		});
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element = $$value;
    			$$invalidate(2, element);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('class' in $$props) $$invalidate(0, clazz = $$props.class);
    		if ('autoHide' in $$props) $$invalidate(3, autoHide = $$props.autoHide);
    		if ('scrollbarMinSize' in $$props) $$invalidate(4, scrollbarMinSize = $$props.scrollbarMinSize);
    		if ('scrollbarMaxSize' in $$props) $$invalidate(5, scrollbarMaxSize = $$props.scrollbarMaxSize);
    		if ('classNames' in $$props) $$invalidate(6, classNames = $$props.classNames);
    		if ('forceVisible' in $$props) $$invalidate(7, forceVisible = $$props.forceVisible);
    		if ('direction' in $$props) $$invalidate(8, direction = $$props.direction);
    		if ('timeout' in $$props) $$invalidate(9, timeout = $$props.timeout);
    		if ('clickOnTrack' in $$props) $$invalidate(10, clickOnTrack = $$props.clickOnTrack);
    		if ('style' in $$props) $$invalidate(1, style = $$props.style);
    		if ('$$scope' in $$props) $$invalidate(11, $$scope = $$props.$$scope);
    	};

    	return [
    		clazz,
    		style,
    		element,
    		autoHide,
    		scrollbarMinSize,
    		scrollbarMaxSize,
    		classNames,
    		forceVisible,
    		direction,
    		timeout,
    		clickOnTrack,
    		$$scope,
    		slots,
    		div_binding
    	];
    }

    class Src extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			class: 0,
    			autoHide: 3,
    			scrollbarMinSize: 4,
    			scrollbarMaxSize: 5,
    			classNames: 6,
    			forceVisible: 7,
    			direction: 8,
    			timeout: 9,
    			clickOnTrack: 10,
    			style: 1
    		});
    	}
    }

    /* src\components\sites\myUnits.svelte generated by Svelte v3.44.2 */

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (16:3) {#if unit.location == location}
    function create_if_block$3(ctx) {
    	let unitcard;
    	let current;

    	unitcard = new MyUnitCard({
    			props: {
    				unitData: /*unit*/ ctx[3],
    				sellDecrease: /*sellDecrease*/ ctx[2]
    			}
    		});

    	return {
    		c() {
    			create_component(unitcard.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(unitcard, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const unitcard_changes = {};
    			if (dirty & /*unitData*/ 2) unitcard_changes.unitData = /*unit*/ ctx[3];
    			if (dirty & /*sellDecrease*/ 4) unitcard_changes.sellDecrease = /*sellDecrease*/ ctx[2];
    			unitcard.$set(unitcard_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(unitcard.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(unitcard.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(unitcard, detaching);
    		}
    	};
    }

    // (15:2) {#each unitData as unit}
    function create_each_block$2(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*unit*/ ctx[3].location == /*location*/ ctx[0] && create_if_block$3(ctx);

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty$1();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (/*unit*/ ctx[3].location == /*location*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*unitData, location*/ 3) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (9:0) <SimpleBar   forceVisible={true}   direction={"ltr"}   style="width: 819.19px; height: 600px"  >
    function create_default_slot$2(ctx) {
    	let div;
    	let current;
    	let each_value = /*unitData*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(div, "class", "relative grid w-4/5 h-full p-10 grid-flow-col gap-5");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty & /*unitData, sellDecrease, location*/ 7) {
    				each_value = /*unitData*/ ctx[1];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function create_fragment$5(ctx) {
    	let simplebar;
    	let current;

    	simplebar = new Src({
    			props: {
    				forceVisible: true,
    				direction: "ltr",
    				style: "width: 819.19px; height: 600px",
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			create_component(simplebar.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(simplebar, target, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const simplebar_changes = {};

    			if (dirty & /*$$scope, unitData, sellDecrease, location*/ 71) {
    				simplebar_changes.$$scope = { dirty, ctx };
    			}

    			simplebar.$set(simplebar_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(simplebar.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(simplebar.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(simplebar, detaching);
    		}
    	};
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { location } = $$props;
    	let { unitData } = $$props;
    	let { sellDecrease } = $$props;

    	$$self.$$set = $$props => {
    		if ('location' in $$props) $$invalidate(0, location = $$props.location);
    		if ('unitData' in $$props) $$invalidate(1, unitData = $$props.unitData);
    		if ('sellDecrease' in $$props) $$invalidate(2, sellDecrease = $$props.sellDecrease);
    	};

    	return [location, unitData, sellDecrease];
    }

    class MyUnits extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			location: 0,
    			unitData: 1,
    			sellDecrease: 2
    		});
    	}
    }

    /* src\components\utils\buyUnitCard.svelte generated by Svelte v3.44.2 */

    function create_if_block_2$1(ctx) {
    	let modal;
    	let current;

    	modal = new Modal({
    			props: {
    				text: /*$LocaleSettings*/ ctx[2].purchaseConfirmation
    			}
    		});

    	modal.$on("modalEvent", /*confirmPurchase*/ ctx[6]);

    	return {
    		c() {
    			create_component(modal.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const modal_changes = {};
    			if (dirty & /*$LocaleSettings*/ 4) modal_changes.text = /*$LocaleSettings*/ ctx[2].purchaseConfirmation;
    			modal.$set(modal_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};
    }

    // (62:3) {#if unitData.rentPrice > 0}
    function create_if_block_1$2(ctx) {
    	let t0_value = /*$LocaleSettings*/ ctx[2].rentPrice + "";
    	let t0;
    	let t1;
    	let t2_value = /*unitData*/ ctx[0].rentPrice + "";
    	let t2;

    	return {
    		c() {
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    		},
    		m(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, t1, anchor);
    			insert(target, t2, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*$LocaleSettings*/ 4 && t0_value !== (t0_value = /*$LocaleSettings*/ ctx[2].rentPrice + "")) set_data(t0, t0_value);
    			if (dirty & /*unitData*/ 1 && t2_value !== (t2_value = /*unitData*/ ctx[0].rentPrice + "")) set_data(t2, t2_value);
    		},
    		d(detaching) {
    			if (detaching) detach(t0);
    			if (detaching) detach(t1);
    			if (detaching) detach(t2);
    		}
    	};
    }

    // (68:3) {#if unitData.buyPrice > 0}
    function create_if_block$2(ctx) {
    	let t0_value = /*$LocaleSettings*/ ctx[2].buyPrice + "";
    	let t0;
    	let t1;
    	let t2_value = /*unitData*/ ctx[0].buyPrice + "";
    	let t2;

    	return {
    		c() {
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    		},
    		m(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, t1, anchor);
    			insert(target, t2, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*$LocaleSettings*/ 4 && t0_value !== (t0_value = /*$LocaleSettings*/ ctx[2].buyPrice + "")) set_data(t0, t0_value);
    			if (dirty & /*unitData*/ 1 && t2_value !== (t2_value = /*unitData*/ ctx[0].buyPrice + "")) set_data(t2, t2_value);
    		},
    		d(detaching) {
    			if (detaching) detach(t0);
    			if (detaching) detach(t1);
    			if (detaching) detach(t2);
    		}
    	};
    }

    function create_fragment$4(ctx) {
    	let t0;
    	let div1;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t1;
    	let div0;
    	let p0;
    	let t2_value = /*$UnitSettings*/ ctx[3][/*unitData*/ ctx[0].type].label + "";
    	let t2;
    	let t3;
    	let p1;
    	let t4_value = /*$LocaleSettings*/ ctx[2].totalWeight + "";
    	let t4;
    	let t5;
    	let t6_value = /*$UnitSettings*/ ctx[3][/*unitData*/ ctx[0].type].size + "";
    	let t6;
    	let t7;
    	let p2;
    	let t8;
    	let p3;
    	let t9;
    	let button0;
    	let t10_value = /*$LocaleSettings*/ ctx[2].buyUnit + "";
    	let t10;
    	let t11;
    	let button1;
    	let t12_value = /*$LocaleSettings*/ ctx[2].rentUnit + "";
    	let t12;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*showModal*/ ctx[1] && create_if_block_2$1(ctx);
    	let if_block1 = /*unitData*/ ctx[0].rentPrice > 0 && create_if_block_1$2(ctx);
    	let if_block2 = /*unitData*/ ctx[0].buyPrice > 0 && create_if_block$2(ctx);

    	return {
    		c() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div1 = element("div");
    			img = element("img");
    			t1 = space();
    			div0 = element("div");
    			p0 = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			p1 = element("p");
    			t4 = text(t4_value);
    			t5 = space();
    			t6 = text(t6_value);
    			t7 = space();
    			p2 = element("p");
    			if (if_block1) if_block1.c();
    			t8 = space();
    			p3 = element("p");
    			if (if_block2) if_block2.c();
    			t9 = space();
    			button0 = element("button");
    			t10 = text(t10_value);
    			t11 = space();
    			button1 = element("button");
    			t12 = text(t12_value);
    			attr(img, "class", "w-1/2");
    			if (!src_url_equal(img.src, img_src_value = /*$UnitSettings*/ ctx[3][/*unitData*/ ctx[0].type].image)) attr(img, "src", img_src_value);
    			attr(img, "alt", img_alt_value = /*$UnitSettings*/ ctx[3][/*unitData*/ ctx[0].type].type);
    			attr(p0, "class", "font-bold");
    			attr(button0, "class", "py-1 px-4 mt-5 bg-gray-700 border-0 rounded font-sans uppercase transition-all duration-300 ease-in-out hover:shadow-lg hover:bg-purple-800");
    			attr(button1, "class", "py-1 px-4 mt-5 bg-gray-700 border-0 rounded font-sans uppercase transition-all duration-300 ease-in-out hover:shadow-lg hover:bg-purple-800");
    			attr(div0, "class", "text-xl font-sans uppercase text-center");
    			attr(div1, "class", "flex flex-col justify-around items-center rounded-lg shadow-lg text-white bg-gray-800 w-[300px]");
    		},
    		m(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert(target, t0, anchor);
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, t1);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t2);
    			append(div0, t3);
    			append(div0, p1);
    			append(p1, t4);
    			append(p1, t5);
    			append(p1, t6);
    			append(div0, t7);
    			append(div0, p2);
    			if (if_block1) if_block1.m(p2, null);
    			append(div0, t8);
    			append(div0, p3);
    			if (if_block2) if_block2.m(p3, null);
    			append(div0, t9);
    			append(div0, button0);
    			append(button0, t10);
    			append(div0, t11);
    			append(div0, button1);
    			append(button1, t12);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(button0, "click", function () {
    						if (is_function(/*buyUnit*/ ctx[4](`${/*unitData*/ ctx[0].type}`))) /*buyUnit*/ ctx[4](`${/*unitData*/ ctx[0].type}`).apply(this, arguments);
    					}),
    					listen(button1, "click", function () {
    						if (is_function(/*rentUnit*/ ctx[5](`${/*unitData*/ ctx[0].type}`))) /*rentUnit*/ ctx[5](`${/*unitData*/ ctx[0].type}`).apply(this, arguments);
    					})
    				];

    				mounted = true;
    			}
    		},
    		p(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (/*showModal*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*showModal*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2$1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*$UnitSettings, unitData*/ 9 && !src_url_equal(img.src, img_src_value = /*$UnitSettings*/ ctx[3][/*unitData*/ ctx[0].type].image)) {
    				attr(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*$UnitSettings, unitData*/ 9 && img_alt_value !== (img_alt_value = /*$UnitSettings*/ ctx[3][/*unitData*/ ctx[0].type].type)) {
    				attr(img, "alt", img_alt_value);
    			}

    			if ((!current || dirty & /*$UnitSettings, unitData*/ 9) && t2_value !== (t2_value = /*$UnitSettings*/ ctx[3][/*unitData*/ ctx[0].type].label + "")) set_data(t2, t2_value);
    			if ((!current || dirty & /*$LocaleSettings*/ 4) && t4_value !== (t4_value = /*$LocaleSettings*/ ctx[2].totalWeight + "")) set_data(t4, t4_value);
    			if ((!current || dirty & /*$UnitSettings, unitData*/ 9) && t6_value !== (t6_value = /*$UnitSettings*/ ctx[3][/*unitData*/ ctx[0].type].size + "")) set_data(t6, t6_value);

    			if (/*unitData*/ ctx[0].rentPrice > 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1$2(ctx);
    					if_block1.c();
    					if_block1.m(p2, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*unitData*/ ctx[0].buyPrice > 0) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block$2(ctx);
    					if_block2.c();
    					if_block2.m(p3, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if ((!current || dirty & /*$LocaleSettings*/ 4) && t10_value !== (t10_value = /*$LocaleSettings*/ ctx[2].buyUnit + "")) set_data(t10, t10_value);
    			if ((!current || dirty & /*$LocaleSettings*/ 4) && t12_value !== (t12_value = /*$LocaleSettings*/ ctx[2].rentUnit + "")) set_data(t12, t12_value);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block0);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block0);
    			current = false;
    		},
    		d(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach(t0);
    			if (detaching) detach(div1);
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $LocaleSettings;
    	let $UnitSettings;
    	component_subscribe($$self, LocaleSettings, $$value => $$invalidate(2, $LocaleSettings = $$value));
    	component_subscribe($$self, UnitSettings, $$value => $$invalidate(3, $UnitSettings = $$value));
    	let { unitData } = $$props;
    	let { location } = $$props;
    	let showModal = false;
    	let currentType = null;
    	let renting;

    	function buyUnit(e) {
    		renting = false;
    		$$invalidate(1, showModal = true);
    		currentType = e;
    	}

    	function rentUnit(e) {
    		renting = true;
    		$$invalidate(1, showModal = true);
    		currentType = e;
    	}

    	function confirmPurchase(e) {
    		$$invalidate(1, showModal = false);

    		if (e.detail.option === "confirm") {
    			fetch("https://doughStorage/buyUnit", {
    				method: "post",
    				body: JSON.stringify({
    					unitType: currentType,
    					isRenting: renting,
    					location,
    					rentPrice: unitData.rentPrice,
    					buyPrice: unitData.buyPrice
    				})
    			});
    		}
    	}

    	$$self.$$set = $$props => {
    		if ('unitData' in $$props) $$invalidate(0, unitData = $$props.unitData);
    		if ('location' in $$props) $$invalidate(7, location = $$props.location);
    	};

    	return [
    		unitData,
    		showModal,
    		$LocaleSettings,
    		$UnitSettings,
    		buyUnit,
    		rentUnit,
    		confirmPurchase,
    		location
    	];
    }

    class BuyUnitCard extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { unitData: 0, location: 7 });
    	}
    }

    /* src\components\sites\buyUnits.svelte generated by Svelte v3.44.2 */

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (18:2) {#each locationTypes as unit}
    function create_each_block$1(ctx) {
    	let unitcard;
    	let current;

    	unitcard = new BuyUnitCard({
    			props: {
    				unitData: /*unit*/ ctx[4],
    				location: /*location*/ ctx[0]
    			}
    		});

    	return {
    		c() {
    			create_component(unitcard.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(unitcard, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const unitcard_changes = {};
    			if (dirty & /*location*/ 1) unitcard_changes.location = /*location*/ ctx[0];
    			unitcard.$set(unitcard_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(unitcard.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(unitcard.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(unitcard, detaching);
    		}
    	};
    }

    // (12:0) <SimpleBar   forceVisible={true}   direction={"ltr"}   style="width: 819.19px; height: 600px"  >
    function create_default_slot$1(ctx) {
    	let div;
    	let current;
    	let each_value = /*locationTypes*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(div, "class", "relative grid w-4/5 h-full p-10 grid-flow-col gap-5");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty & /*locationTypes, location*/ 3) {
    				each_value = /*locationTypes*/ ctx[1];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function create_fragment$3(ctx) {
    	let simplebar;
    	let current;

    	simplebar = new Src({
    			props: {
    				forceVisible: true,
    				direction: "ltr",
    				style: "width: 819.19px; height: 600px",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			create_component(simplebar.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(simplebar, target, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const simplebar_changes = {};

    			if (dirty & /*$$scope, location*/ 129) {
    				simplebar_changes.$$scope = { dirty, ctx };
    			}

    			simplebar.$set(simplebar_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(simplebar.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(simplebar.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(simplebar, detaching);
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $UnitLocations;
    	component_subscribe($$self, UnitLocations, $$value => $$invalidate(2, $UnitLocations = $$value));
    	let { location } = $$props;
    	$UnitLocations[location].label;
    	const locationTypes = $UnitLocations[location].types;

    	$$self.$$set = $$props => {
    		if ('location' in $$props) $$invalidate(0, location = $$props.location);
    	};

    	return [location, locationTypes];
    }

    class BuyUnits extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { location: 0 });
    	}
    }

    /* src\components\utils\raidItem.svelte generated by Svelte v3.44.2 */

    function create_if_block_1$1(ctx) {
    	let modal;
    	let current;

    	modal = new Modal({
    			props: {
    				text: /*$LocaleSettings*/ ctx[3].raidConfirmation
    			}
    		});

    	modal.$on("modalEvent", /*confirmAction*/ ctx[4]);

    	return {
    		c() {
    			create_component(modal.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const modal_changes = {};
    			if (dirty & /*$LocaleSettings*/ 8) modal_changes.text = /*$LocaleSettings*/ ctx[3].raidConfirmation;
    			modal.$set(modal_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};
    }

    // (47:4) {:else}
    function create_else_block(ctx) {
    	let t_value = /*importData*/ ctx[0].name + "";
    	let t;

    	return {
    		c() {
    			t = text(t_value);
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*importData*/ 1 && t_value !== (t_value = /*importData*/ ctx[0].name + "")) set_data(t, t_value);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (45:4) {#if useName}
    function create_if_block$1(ctx) {
    	let t_value = /*importData*/ ctx[0].owner + "";
    	let t;

    	return {
    		c() {
    			t = text(t_value);
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*importData*/ 1 && t_value !== (t_value = /*importData*/ ctx[0].owner + "")) set_data(t, t_value);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    function create_fragment$2(ctx) {
    	let t0;
    	let div1;
    	let div0;
    	let p0;
    	let t1_value = /*$LocaleSettings*/ ctx[3].storageNumber + "";
    	let t1;
    	let t2;
    	let span0;
    	let t3_value = /*importData*/ ctx[0].id + "";
    	let t3;
    	let t4;
    	let p1;
    	let t5_value = /*$LocaleSettings*/ ctx[3].ownerLabel + "";
    	let t5;
    	let t6;
    	let span1;
    	let t7;
    	let button;
    	let t8_value = /*$LocaleSettings*/ ctx[3].raidUnit + "";
    	let t8;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*showModal*/ ctx[2] && create_if_block_1$1(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*useName*/ ctx[1]) return create_if_block$1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type(ctx);

    	return {
    		c() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div1 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			span0 = element("span");
    			t3 = text(t3_value);
    			t4 = space();
    			p1 = element("p");
    			t5 = text(t5_value);
    			t6 = space();
    			span1 = element("span");
    			if_block1.c();
    			t7 = space();
    			button = element("button");
    			t8 = text(t8_value);
    			attr(span0, "class", "font-normal");
    			attr(p0, "class", "font-bold");
    			attr(span1, "class", "font-normal");
    			attr(p1, "class", "font-bold ml-10");
    			attr(button, "class", "py-1 px-4 ml-10 bg-gray-700 border-0 rounded font-sans uppercase transition-all duration-300 ease-in-out hover:shadow-lg hover:bg-purple-800");
    			attr(div0, "class", "uppercase text-white flex flex-row justify-between items-center w-full");
    			attr(div1, "class", "bg-gray-800 w-full h-fit rounded flex flex-row p-3 shadow-md");
    		},
    		m(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert(target, t0, anchor);
    			insert(target, div1, anchor);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t1);
    			append(p0, t2);
    			append(p0, span0);
    			append(span0, t3);
    			append(div0, t4);
    			append(div0, p1);
    			append(p1, t5);
    			append(p1, t6);
    			append(p1, span1);
    			if_block1.m(span1, null);
    			append(div0, t7);
    			append(div0, button);
    			append(button, t8);
    			current = true;

    			if (!mounted) {
    				dispose = listen(button, "click", /*raidUnit*/ ctx[5]);
    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (/*showModal*/ ctx[2]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*showModal*/ 4) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if ((!current || dirty & /*$LocaleSettings*/ 8) && t1_value !== (t1_value = /*$LocaleSettings*/ ctx[3].storageNumber + "")) set_data(t1, t1_value);
    			if ((!current || dirty & /*importData*/ 1) && t3_value !== (t3_value = /*importData*/ ctx[0].id + "")) set_data(t3, t3_value);
    			if ((!current || dirty & /*$LocaleSettings*/ 8) && t5_value !== (t5_value = /*$LocaleSettings*/ ctx[3].ownerLabel + "")) set_data(t5, t5_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(span1, null);
    				}
    			}

    			if ((!current || dirty & /*$LocaleSettings*/ 8) && t8_value !== (t8_value = /*$LocaleSettings*/ ctx[3].raidUnit + "")) set_data(t8, t8_value);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block0);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block0);
    			current = false;
    		},
    		d(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach(t0);
    			if (detaching) detach(div1);
    			if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $LocaleSettings;
    	component_subscribe($$self, LocaleSettings, $$value => $$invalidate(3, $LocaleSettings = $$value));
    	let { importData } = $$props;
    	let { useName } = $$props;
    	let showModal = false;

    	function confirmAction(e) {
    		$$invalidate(2, showModal = false);

    		if (e.detail.option === "confirm") {
    			fetch("https://doughStorage/raidUnit", {
    				method: "post",
    				body: JSON.stringify({
    					location,
    					id: importData.id,
    					owner: importData.owner
    				})
    			});
    		}
    	}

    	function raidUnit(e) {
    		$$invalidate(2, showModal = true);
    	}

    	$$self.$$set = $$props => {
    		if ('importData' in $$props) $$invalidate(0, importData = $$props.importData);
    		if ('useName' in $$props) $$invalidate(1, useName = $$props.useName);
    	};

    	return [importData, useName, showModal, $LocaleSettings, confirmAction, raidUnit];
    }

    class RaidItem extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { importData: 0, useName: 1 });
    	}
    }

    /* src\components\sites\raidUnits.svelte generated by Svelte v3.44.2 */

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (38:3) {#each filteredArray as unit}
    function create_each_block(ctx) {
    	let raidcard;
    	let current;

    	raidcard = new RaidItem({
    			props: {
    				importData: /*unit*/ ctx[6],
    				useName: /*useNames*/ ctx[0]
    			}
    		});

    	return {
    		c() {
    			create_component(raidcard.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(raidcard, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const raidcard_changes = {};
    			if (dirty & /*filteredArray*/ 4) raidcard_changes.importData = /*unit*/ ctx[6];
    			if (dirty & /*useNames*/ 1) raidcard_changes.useName = /*useNames*/ ctx[0];
    			raidcard.$set(raidcard_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(raidcard.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(raidcard.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(raidcard, detaching);
    		}
    	};
    }

    // (36:1) <SimpleBar forceVisible={true} style="height: 90%; width: 620px">
    function create_default_slot(ctx) {
    	let div;
    	let current;
    	let each_value = /*filteredArray*/ ctx[2];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(div, "class", "h-full w-[600px] flex flex-col gap-5");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty & /*filteredArray, useNames*/ 5) {
    				each_value = /*filteredArray*/ ctx[2];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let input;
    	let input_placeholder_value;
    	let t;
    	let simplebar;
    	let current;
    	let mounted;
    	let dispose;

    	simplebar = new Src({
    			props: {
    				forceVisible: true,
    				style: "height: 90%; width: 620px",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			div1 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t = space();
    			create_component(simplebar.$$.fragment);
    			attr(input, "type", "text");
    			attr(input, "id", "searchInput");
    			attr(input, "placeholder", input_placeholder_value = /*$LocaleSettings*/ ctx[3].searchInput);
    			attr(input, "class", "p-2 bg-transparent text-white border-b-2 border-white focus:outline-none");
    			attr(div0, "class", "relative w-40 h-10 mb-5 self-start");
    			attr(div1, "class", "flex justify-center items-center flex-col relative w-4/5 h-full p-5 font-sans");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);
    			append(div0, input);
    			set_input_value(input, /*searchTerm*/ ctx[1]);
    			append(div1, t);
    			mount_component(simplebar, div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen(input, "input", /*input_input_handler*/ ctx[5]);
    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (!current || dirty & /*$LocaleSettings*/ 8 && input_placeholder_value !== (input_placeholder_value = /*$LocaleSettings*/ ctx[3].searchInput)) {
    				attr(input, "placeholder", input_placeholder_value);
    			}

    			if (dirty & /*searchTerm*/ 2 && input.value !== /*searchTerm*/ ctx[1]) {
    				set_input_value(input, /*searchTerm*/ ctx[1]);
    			}

    			const simplebar_changes = {};

    			if (dirty & /*$$scope, filteredArray, useNames*/ 517) {
    				simplebar_changes.$$scope = { dirty, ctx };
    			}

    			simplebar.$set(simplebar_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(simplebar.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(simplebar.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			destroy_component(simplebar);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $LocaleSettings;
    	component_subscribe($$self, LocaleSettings, $$value => $$invalidate(3, $LocaleSettings = $$value));
    	let { units } = $$props;
    	let { useNames } = $$props;
    	let searchTerm = "";
    	let filteredArray = [];

    	function input_input_handler() {
    		searchTerm = this.value;
    		$$invalidate(1, searchTerm);
    	}

    	$$self.$$set = $$props => {
    		if ('units' in $$props) $$invalidate(4, units = $$props.units);
    		if ('useNames' in $$props) $$invalidate(0, useNames = $$props.useNames);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*searchTerm, units*/ 18) {
    			{
    				if (searchTerm) {
    					$$invalidate(2, filteredArray = units.filter(unit => unit.owner.toLowerCase().includes(searchTerm.toLowerCase()) || unit.id.toString().toLowerCase().includes(searchTerm.toLowerCase())));
    				} else {
    					$$invalidate(2, filteredArray = [...units]);
    				}
    			}
    		}
    	};

    	return [
    		useNames,
    		searchTerm,
    		filteredArray,
    		$LocaleSettings,
    		units,
    		input_input_handler
    	];
    }

    class RaidUnits extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { units: 4, useNames: 0 });
    	}
    }

    //
    // ----------------------------------
    // DO NOT TOUCH ANYTHING BELOW HERE!
    // ----------------------------------
    //

    function hideGlobalDisplay() {
    	fetch("https://doughStorage/hideDisplay", {
    		method: "post",
    		body: JSON.stringify({}),
    	});
    }

    /* src\App.svelte generated by Svelte v3.44.2 */

    function create_if_block(ctx) {
    	let main;
    	let div;
    	let sidebar;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let current;

    	sidebar = new Sidebar({
    			props: {
    				location: /*currentLocation*/ ctx[4],
    				police: /*isPolice*/ ctx[2],
    				communityName: /*communityName*/ ctx[5],
    				communityLogo: /*communityLogo*/ ctx[6]
    			}
    		});

    	sidebar.$on("clickEvent", /*handleMenuChange*/ ctx[12]);
    	const if_block_creators = [create_if_block_1, create_if_block_2, create_if_block_3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*menu*/ ctx[1] === "myUnits") return 0;
    		if (/*menu*/ ctx[1] === "buyUnits") return 1;
    		if (/*isPolice*/ ctx[2] && /*menu*/ ctx[1] === "raidUnits") return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	return {
    		c() {
    			main = element("main");
    			div = element("div");
    			create_component(sidebar.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			attr(div, "class", "flex flex-row h-[600px] w-[1024px] bg-gray-700 rounded-lg");
    			attr(main, "class", "flex justify-center items-center w-full h-screen");
    		},
    		m(target, anchor) {
    			insert(target, main, anchor);
    			append(main, div);
    			mount_component(sidebar, div, null);
    			append(div, t);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			const sidebar_changes = {};
    			if (dirty & /*currentLocation*/ 16) sidebar_changes.location = /*currentLocation*/ ctx[4];
    			if (dirty & /*isPolice*/ 4) sidebar_changes.police = /*isPolice*/ ctx[2];
    			if (dirty & /*communityName*/ 32) sidebar_changes.communityName = /*communityName*/ ctx[5];
    			if (dirty & /*communityLogo*/ 64) sidebar_changes.communityLogo = /*communityLogo*/ ctx[6];
    			sidebar.$set(sidebar_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(sidebar.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(sidebar.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(main);
    			destroy_component(sidebar);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
    		}
    	};
    }

    // (111:46) 
    function create_if_block_3(ctx) {
    	let raidunits;
    	let current;

    	raidunits = new RaidUnits({
    			props: {
    				units: /*$RaidableUnits*/ ctx[9],
    				useNames: /*useNames*/ ctx[3]
    			}
    		});

    	return {
    		c() {
    			create_component(raidunits.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(raidunits, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const raidunits_changes = {};
    			if (dirty & /*$RaidableUnits*/ 512) raidunits_changes.units = /*$RaidableUnits*/ ctx[9];
    			if (dirty & /*useNames*/ 8) raidunits_changes.useNames = /*useNames*/ ctx[3];
    			raidunits.$set(raidunits_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(raidunits.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(raidunits.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(raidunits, detaching);
    		}
    	};
    }

    // (109:33) 
    function create_if_block_2(ctx) {
    	let buyunits;
    	let current;

    	buyunits = new BuyUnits({
    			props: { location: /*currentLocation*/ ctx[4] }
    		});

    	return {
    		c() {
    			create_component(buyunits.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(buyunits, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const buyunits_changes = {};
    			if (dirty & /*currentLocation*/ 16) buyunits_changes.location = /*currentLocation*/ ctx[4];
    			buyunits.$set(buyunits_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(buyunits.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(buyunits.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(buyunits, detaching);
    		}
    	};
    }

    // (103:3) {#if menu === "myUnits"}
    function create_if_block_1(ctx) {
    	let myunits;
    	let current;

    	myunits = new MyUnits({
    			props: {
    				location: /*currentLocation*/ ctx[4],
    				unitData: /*$UnitData*/ ctx[8],
    				sellDecrease: /*sellDecrease*/ ctx[7]
    			}
    		});

    	return {
    		c() {
    			create_component(myunits.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(myunits, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const myunits_changes = {};
    			if (dirty & /*currentLocation*/ 16) myunits_changes.location = /*currentLocation*/ ctx[4];
    			if (dirty & /*$UnitData*/ 256) myunits_changes.unitData = /*$UnitData*/ ctx[8];
    			if (dirty & /*sellDecrease*/ 128) myunits_changes.sellDecrease = /*sellDecrease*/ ctx[7];
    			myunits.$set(myunits_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(myunits.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(myunits.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(myunits, detaching);
    		}
    	};
    }

    function create_fragment(ctx) {
    	let title_value;
    	let t;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	document.title = title_value = /*communityName*/ ctx[5];
    	let if_block = /*displayUI*/ ctx[0] && create_if_block(ctx);

    	return {
    		c() {
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty$1();
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(window, "keydown", /*handleWindowClick*/ ctx[10]),
    					listen(window, "message", /*handleWindowMessage*/ ctx[11])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if ((!current || dirty & /*communityName*/ 32) && title_value !== (title_value = /*communityName*/ ctx[5])) {
    				document.title = title_value;
    			}

    			if (/*displayUI*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*displayUI*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let $UnitData;
    	let $RaidableUnits;
    	component_subscribe($$self, UnitData, $$value => $$invalidate(8, $UnitData = $$value));
    	component_subscribe($$self, RaidableUnits, $$value => $$invalidate(9, $RaidableUnits = $$value));
    	let displayUI = false;
    	let menu = "myUnits";
    	let isPolice = false;
    	let useNames = false;
    	let currentLocation = "";
    	let communityName = "";
    	let communityLogo = "";
    	let sellDecrease = 0;

    	function handleWindowClick(e) {
    		if (e.key == "Escape") {
    			$$invalidate(0, displayUI = !displayUI);
    			hideDisplay();
    		}
    	}

    	function handleWindowMessage(e) {
    		if (e.data.type === "showUI") {
    			if (displayUI) clearOldData();
    			$$invalidate(0, displayUI = true);
    			UnitData.set(e.data.unitdata);
    			UnitSettings.set(e.data.unitsettings);
    			UnitLocations.set(e.data.unitlocations);
    			$$invalidate(2, isPolice = e.data.ispolice);
    			$$invalidate(3, useNames = e.data.useName);
    			RaidableUnits.set(e.data.allunitsdata);
    			LocaleSettings.set(e.data.locales);
    			$$invalidate(4, currentLocation = e.data.currentlocation);
    			$$invalidate(5, communityName = e.data.communityName);
    			$$invalidate(6, communityLogo = e.data.communityLogo);
    			$$invalidate(7, sellDecrease = e.data.sellDecrease);
    		} else if (e.data.type === "hideUI" && displayUI) {
    			hideDisplay();
    		}
    	}

    	function handleMenuChange(e) {
    		$$invalidate(1, menu = e.detail.menu);
    	}

    	function hideDisplay() {
    		$$invalidate(0, displayUI = false);
    		UnitData.set([]);
    		UnitSettings.set([]);
    		UnitLocations.set([]);
    		RaidableUnits.set([]);
    		LocaleSettings.set([]);
    		$$invalidate(2, isPolice = false);
    		$$invalidate(4, currentLocation = "");
    		$$invalidate(5, communityName = "");
    		$$invalidate(6, communityLogo = "");
    		$$invalidate(7, sellDecrease = 0);
    		hideGlobalDisplay();
    	}

    	function clearOldData() {
    		UnitData.set([]);
    		UnitSettings.set([]);
    		UnitLocations.set([]);
    		RaidableUnits.set([]);
    		LocaleSettings.set([]);
    		$$invalidate(2, isPolice = false);
    		$$invalidate(4, currentLocation = "");
    		$$invalidate(5, communityName = "");
    		$$invalidate(6, communityLogo = "");
    		$$invalidate(7, sellDecrease = 0);
    	}

    	return [
    		displayUI,
    		menu,
    		isPolice,
    		useNames,
    		currentLocation,
    		communityName,
    		communityLogo,
    		sellDecrease,
    		$UnitData,
    		$RaidableUnits,
    		handleWindowClick,
    		handleWindowMessage,
    		handleMenuChange
    	];
    }

    class App extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment, safe_not_equal, {});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
