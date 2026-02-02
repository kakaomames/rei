public record ahq(float b, boolean c) implements aay<adb> {
   public static final aao<wx, ahq> a = aay.a(ahq::a, ahq::new);

   private ahq(wx $$0) {
      this($$0.readFloat(), $$0.readBoolean());
   }

   public ahq(float param1, boolean param2) {
      this.b = $$0;
      this.c = $$1;
   }

   public static ahq a(cdo $$0) {
      return new ahq($$0.f(), $$0.l());
   }

   private void a(wx $$0) {
      $$0.a(this.b);
      $$0.a(this.c);
   }

   public aba<ahq> a() {
      return ahz.cx;
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
}
