public record afy(ahx e, byte f) implements aay<adb> {
   public static final aao<xq, afy> a = aay.a(afy::a, afy::new);
   public static final byte b = 1;
   public static final byte c = 2;
   public static final byte d = 3;

   private afy(xq $$0) {
      this(new ahx($$0), $$0.readByte());
   }

   public afy(ahx param1, byte param2) {
      this.e = $$0;
      this.f = $$1;
   }

   private void a(xq $$0) {
      this.e.a($$0);
      $$0.l(this.f);
   }

   public aba<afy> a() {
      return ahz.au;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public boolean a(byte $$0) {
      return (this.f & $$0) != 0;
   }

   public ahx b() {
      return this.e;
   }

   public byte e() {
      return this.f;
   }
}
