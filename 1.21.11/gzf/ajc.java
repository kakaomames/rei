public record ajc(ftm b, float c, float d, boolean e) implements aay<aib> {
   public static final aao<wx, ajc> a;

   public ajc(ftm param1, float param2, float param3, boolean param4) {
      this.b = $$0;
      this.c = $$1;
      this.d = $$2;
      this.e = $$3;
   }

   public static ajc a(cgk $$0) {
      return $$0.ch() ? new ajc($$0.l_().a(), $$0.l_().b(), $$0.l_().c(), $$0.aV()) : new ajc($$0.dI(), $$0.ec(), $$0.ee(), $$0.aV());
   }

   public aba<ajc> a() {
      return ahz.bT;
   }

   public void a(aib $$0) {
      $$0.a(this);
   }

   public ftm b() {
      return this.b;
   }

   public float e() {
      return this.c;
   }

   public float f() {
      return this.d;
   }

   public boolean g() {
      return this.e;
   }

   static {
      a = aao.a(ftm.b, ajc::b, aam.l, ajc::e, aam.l, ajc::f, aam.b, ajc::g, ajc::new);
   }
}
