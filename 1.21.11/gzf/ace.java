public record ace(amo a) implements acd {
   public ace(amo param1) {
      this.a = $$0;
   }

   public static <T extends wx> aao<T, ace> a(amo $$0, int $$1) {
      return acd.a(($$0x, $$1x) -> {
      }, ($$2) -> {
         int $$3 = $$2.readableBytes();
         if ($$3 >= 0 && $$3 <= $$1) {
            $$2.k($$3);
            return new ace($$0);
         } else {
            throw new IllegalArgumentException("Payload may not be larger than " + $$1 + " bytes");
         }
      });
   }

   public acd.b<ace> a() {
      return new acd.b(this.a);
   }

   public amo b() {
      return this.a;
   }
}
