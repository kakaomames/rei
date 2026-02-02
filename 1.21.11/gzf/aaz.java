public enum aaz {
   a("serverbound"),
   b("clientbound");

   private final String c;

   private aaz(final String param3) {
      this.c = $$0;
   }

   public aaz a() {
      return this == b ? a : b;
   }

   public String b() {
      return this.c;
   }

   // $FF: synthetic method
   private static aaz[] c() {
      return new aaz[]{a, b};
   }
}
