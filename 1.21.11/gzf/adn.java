import io.netty.buffer.ByteBuf;

public record adn(ccz b, boolean c) implements aay<adb> {
   public static final aao<ByteBuf, adn> a;

   public adn(ccz param1, boolean param2) {
      this.b = $$0;
      this.c = $$1;
   }

   public aba<adn> a() {
      return ahz.l;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public ccz b() {
      return this.b;
   }

   public boolean e() {
      return this.c;
   }

   static {
      a = aao.a(ccz.f, adn::b, aam.b, adn::e, adn::new);
   }
}
