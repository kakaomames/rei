import io.netty.buffer.ByteBuf;

public record agv(int b) implements aay<adb> {
   public static final aao<ByteBuf, agv> a;

   public agv(int param1) {
      this.b = $$0;
   }

   public aba<agv> a() {
      return ahz.aQ;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public int b() {
      return this.b;
   }

   static {
      a = aao.a(aam.h, agv::b, agv::new);
   }
}
