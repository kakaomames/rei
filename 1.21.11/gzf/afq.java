public record afq(float b, boolean c, float d, boolean e) implements aay<adb> {
   public static final aao<wx, afq> a;

   public afq(float param1, boolean param2, float param3, boolean param4) {
      this.b = $$0;
      this.c = $$1;
      this.d = $$2;
      this.e = $$3;
   }

   public aba<afq> a() {
      return ahz.ao;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public float b() {
      return this.b;
   }

   public boolean e() {
      return this.c;
   }

   public float f() {
      return this.d;
   }

   public boolean g() {
      return this.e;
   }

   static {
      a = aao.a(aam.l, afq::b, aam.b, afq::e, aam.l, afq::f, aam.b, afq::g, afq::new);
   }
}
