public record ahd(long b, long c, boolean d) implements aay<adb> {
   public static final aao<wx, ahd> a;

   public ahd(long param1, long param3, boolean param5) {
      this.b = $$0;
      this.c = $$1;
      this.d = $$2;
   }

   public aba<ahd> a() {
      return ahz.aX;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public long b() {
      return this.b;
   }

   public long e() {
      return this.c;
   }

   public boolean f() {
      return this.d;
   }

   static {
      a = aao.a(aam.j, ahd::b, aam.j, ahd::e, aam.b, ahd::f, ahd::new);
   }
}
