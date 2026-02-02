public record aeo(int b, float c) implements aay<adb> {
   public static final aao<wx, aeo> a = aay.a(aeo::a, aeo::new);

   public aeo(chl $$0) {
      this($$0.aA(), $$0.fg());
   }

   private aeo(wx $$0) {
      this($$0.l(), $$0.readFloat());
   }

   public aeo(int param1, float param2) {
      this.b = $$0;
      this.c = $$1;
   }

   private void a(wx $$0) {
      $$0.c(this.b);
      $$0.a(this.c);
   }

   public aba<aeo> a() {
      return ahz.N;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public int b() {
      return this.b;
   }

   public float e() {
      return this.c;
   }
}
