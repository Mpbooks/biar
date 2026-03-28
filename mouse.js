 var ctx, f, e = 0, pos = { x: 0, y: 0 }, lines = [], 
        E = {
            friction: 0.35,
            trails: 20,
            size: 4,
            dampening: 0.15,
            tension: 0.95,
        };

        function n(e) { this.init(e || {}); }
        n.prototype = {
            init: function (e) {
                this.phase = e.phase || 0;
                this.offset = e.offset || 0;
                this.frequency = e.frequency || 0.001;
                this.amplitude = e.amplitude || 1;
            },
            update: function () {
                this.phase += this.frequency;
                return this.offset + Math.sin(this.phase) * this.amplitude;
            }
        };

        function Node() { this.x = 0; this.y = 0; this.vy = 0; this.vx = 0; }

        function Line(e) { this.init(e || {}); }
        Line.prototype = {
            init: function (e) {
                this.spring = e.spring + 0.1 * Math.random() - 0.02;
                this.friction = E.friction + 0.01 * Math.random() - 0.002;
                this.nodes = [];
                for (var t, n = 0; n < E.size; n++) {
                    t = new Node();
                    t.x = pos.x; t.y = pos.y;
                    this.nodes.push(t);
                }
            },
            update: function () {
                var e = this.spring, t = this.nodes[0];
                t.vx += (pos.x - t.x) * e;
                t.vy += (pos.y - t.y) * e;
                for (var n, i = 0, a = this.nodes.length; i < a; i++) {
                    t = this.nodes[i];
                    if (0 < i) {
                        n = this.nodes[i - 1];
                        t.vx += (n.x - t.x) * e;
                        t.vy += (n.y - t.y) * e;
                        t.vx += n.vx * E.dampening;
                        t.vy += n.vy * E.dampening;
                    }
                    t.vx *= this.friction; t.vy *= this.friction;
                    t.x += t.vx; t.y += t.vy;
                    e *= E.tension;
                }
            },
            draw: function () {
                var e, t, n = this.nodes[0].x, i = this.nodes[0].y;
                ctx.beginPath();
                ctx.moveTo(n, i);
                for (var a = 1, o = this.nodes.length - 2; a < o; a++) {
                    e = this.nodes[a]; t = this.nodes[a + 1];
                    n = 0.5 * (e.x + t.x); i = 0.5 * (e.y + t.y);
                    ctx.quadraticCurveTo(e.x, e.y, n, i);
                }
                e = this.nodes[a]; t = this.nodes[a + 1];
                ctx.quadraticCurveTo(e.x, e.y, t.x, t.y);
                ctx.stroke();
                ctx.closePath();
            }
        };

        function renderTrail() {
            if (ctx.running) {
                ctx.globalCompositeOperation = 'source-over';
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.globalCompositeOperation = 'lighter';
                ctx.strokeStyle = '#FFEEC8'; 
                ctx.lineWidth = 1;
                for (var i = 0; i < E.trails; i++) {
                    lines[i].update();
                    lines[i].draw();
                }
                window.requestAnimationFrame(renderTrail);
            }
        }

        window.addEventListener('load', function() {
            ctx = document.getElementById('canvas').getContext('2d');
            ctx.running = true;
            f = new n({ phase: Math.random() * 2 * Math.PI, amplitude: 85, frequency: 0.0015, offset: 285 });
            
            // Inicializa as linhas
            for (var i = 0; i < E.trails; i++) {
                lines.push(new Line({ spring: 0.4 + (i / E.trails) * 0.025 }));
            }

            window.addEventListener('mousemove', function(e) {
                pos.x = e.clientX;
                pos.y = e.clientY;
            });

            window.addEventListener('resize', function() {
                ctx.canvas.width = window.innerWidth;
                ctx.canvas.height = window.innerHeight;
            });

            ctx.canvas.width = window.innerWidth;
            ctx.canvas.height = window.innerHeight;
            renderTrail();
        });