public record akj(int b, String c, int d, aki e) implements aay<akm> {
   public static final aao<wx, akj> a = aay.a(akj::a, akj::new);
   private static final int f = 255;

   /** @deprecated */
   @Deprecated
   public akj(int param1, String param2, int param3, aki param4) {
      this.b = $$0;
      this.c = $$1;
      this.d = $$2;
      this.e = $$3;
   }

   private akj(wx $$0) {
      this($$0.l(), $$0.d(255), $$0.readUnsignedShort(), aki.a($$0.l()));
   }

   private void a(wx $$0) {
      $$0.c(this.b);
      $$0.a(this.c);
      $$0.m(this.d);
      $$0.c(this.e.a());
   }

   public aba<akj> a() {
      return akk.a;
   }

   public void a(akm $$0) {
      $$0.a(this);
   }

   public boolean d() {
      return true;
   }

   public int b() {
      return this.b;
   }

   public String e() {
      return this.c;
   }

   public int f() {
      return this.d;
   }

   public aki g() {
      return this.e;
   }
}
