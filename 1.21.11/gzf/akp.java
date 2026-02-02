public record akp(int b, alc c) implements aay<ako> {
   public static final aao<wx, akp> a = aay.a(akp::a, akp::new);
   private static final int d = 1048576;

   private akp(wx $$0) {
      this($$0.l(), a($$0.q(), $$0));
   }

   public akp(int param1, alc param2) {
      this.b = $$0;
      this.c = $$1;
   }

   private static alc a(amo $$0, wx $$1) {
      return b($$0, $$1);
   }

   private static ale b(amo $$0, wx $$1) {
      int $$2 = $$1.readableBytes();
      if ($$2 >= 0 && $$2 <= 1048576) {
         $$1.k($$2);
         return new ale($$0);
      } else {
         throw new IllegalArgumentException("Payload may not be larger than 1048576 bytes");
      }
   }

   private void a(wx $$0) {
      $$0.c(this.b);
      $$0.a(this.c.a());
      this.c.a($$0);
   }

   public aba<akp> a() {
      return aku.a;
   }

   public void a(ako $$0) {
      $$0.a(this);
   }

   public int b() {
      return this.b;
   }

   public alc e() {
      return this.c;
   }
}
